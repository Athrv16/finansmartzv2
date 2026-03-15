"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function deleteAccount(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });
        if (!user) throw new Error("User not found");

        await db.account.delete({
            where: { id: accountId, userId: user.id },
        });
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const serializeTransaction = (obj) => {
    const serialized = {...obj};

    if(obj.balance){
        serialized.balance = obj.balance.toNumber();
    }

    if(obj.amount){
        serialized.amount = obj.amount.toNumber();
    }

    return serialized;
};

export async function updateDefaultAccount(accountId) {
    try {
        const {userId} = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {clerkUserId : userId},
        });

        if(!user){
            throw new Error("User not found");
        }


        await db.account.updateMany({
                where: {userId: user.id, isDefault: true},
                data: {isDefault: false},
            });


        const account = await db.account.update({
            where:{
                id: accountId,
                userId: user.id,
            },
            data: {isDefault: true},
        });

        revalidatePath("/dashboard");
        return {success: true,  data: serializeTransaction(account)};

    } catch (error) {
        return {success: false, error: error.message};
    }
}

export async function updateAccount(accountId, data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const account = await db.account.findUnique({
            where: { id: accountId, userId: user.id },
        });

        if (!account) {
            throw new Error("Account not found");
        }

        const balanceFloat = parseFloat(data.balance);
        if (Number.isNaN(balanceFloat)) {
            throw new Error("Invalid balance amount");
        }

        const nextIsDefault = Boolean(data.isDefault);

        if (nextIsDefault) {
            await db.account.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
        } else if (account.isDefault) {
            const otherDefault = await db.account.findFirst({
                where: {
                    userId: user.id,
                    isDefault: true,
                    NOT: { id: accountId },
                },
            });
            if (!otherDefault) {
                throw new Error("You need atleast one default account");
            }
        }

        const updatedAccount = await db.account.update({
            where: { id: accountId, userId: user.id },
            data: {
                name: data.name,
                type: data.type,
                balance: balanceFloat,
                isDefault: nextIsDefault,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath(`/account/${accountId}`);

        return { success: true, data: serializeTransaction(updatedAccount) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}


export async function getAccountWithTransactions(accountId) {
     const {userId} = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {clerkUserId : userId},
        });

        if(!user){
            throw new Error("User not found");
        }

     const account = await db.account.findUnique({
        where: {id: accountId , userId: user.id},
        include: {
            transactions: {
                orderBy: {date: "desc"},
            },
            _count:{
                select: {transactions: true},
            },
        },
     });

     if(!account) return null;
      
     return{
        ...serializeTransaction(account),
        transactions: account.transactions.map(serializeTransaction),
     };
}


export async function bulkDeleteTransactions(transactionIds) {
    try{
        const {userId} = await auth();
        if(!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: {clerkUserId: userId},
        });

        if(!user){
            throw new Error("User not found");
        }
        const transaction = await db.transaction.findMany({
            where:{
                id: {in: transactionIds},
                userId: user.id,
            },
        });
        const accountBalanceChanges= transaction.reduce((acc,transaction)=>{
            const change = transaction.type === "EXPENSE"
            ? transaction.amount :-transaction.amount;
            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
            return acc;
        },{});

        //Delete transactions and update account balance in a transaction
        await db.$transaction(async (tx)=> {
            //Delete transaction 
             await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      // Update account balances
      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    for (const accountId of Object.keys(accountBalanceChanges)) {
        revalidatePath(`/account/${accountId}`);
    }

    return {success: true};
 }
     catch(error) {
        return {success: false, error: error.message};
    }
}
