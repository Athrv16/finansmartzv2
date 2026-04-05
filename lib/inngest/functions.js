import { sendEmail } from "@/actions/send-email";
import { db } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";
import { getCategoryName, normalizeCategoryId } from "@/data/categories";
import { Description } from "@radix-ui/react-dialog";
import { accountSchema } from "@/app/lib/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { base64 } from "zod";

export const checkBudgetAlert = inngest.createFunction(
    {name: "Check Budget Alerts"},
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budget" , async () => {
        return await db.budget.findMany({
            include: {
                user: {
                    include: {
                        accounts: {
                            where: {
                                isDefault: true,
                            },
                        },
                    },
                },
            },
        });
    });

    for(const budget of budgets) {
        const defaultAccount = budget.user.accounts[0];
        if (!defaultAccount) continue; //Skip if no default accounts

        await step.run(`check-budget-${budget.id}`, async () => {
            

            const currentDate = new Date();
        const startOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );
        const endOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        );

            const expenses = await db.transaction.aggregate({
                where: {
                    userId: budget.userId,
                    accountId: defaultAccount.id, // Only consider default accountId
                    type: "EXPENSE",
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,

                    },
                },
                _sum:{
                    amount: true,
                },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;
            

        if(percentageUsed>=80 && (!budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date()) ))
        {
                //Send Email
                await sendEmail({
                    to: budget.user.email,
                    subject: `Budget Alert for ${defaultAccount.name}`,
                    react: EmailTemplate({
                        userName: budget.user.name,
                        type: "budget-alert",
                        data:{
                            percentageUsed,
                            budgetAmount: parseInt(budgetAmount).toFixed(1),
                            totalExpenses: parseInt(totalExpenses).toFixed(1),
                            accountName: defaultAccount.name,
                        },
                    }),
                });
                
                //Update lastAlertSent
                await db.budget.update({
                    where: {id: budget.id},
                    data: {lastAlertSent: new Date()},
                });
        }
    });
    }
  });

  function isNewMonth(lastAlertDate, currentDate) {
    return (
        lastAlertDate.getMonth() !== currentDate.getMonth() ||
        lastAlertDate.getFullYear() !== currentDate.getFullYear()
    );
  }

  export const triggerRecurringTransactions = inngest.createFunction({
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  {cron: "0 0 * * *" },
  async ({step }) => {
    //1 Fetch all due recurring transactions
    const recurringTransactions = await step.run(
        "fetch-recurring-transactions",
        async () => {
            return await db.transaction.findMany({
                where: {
                    isRecurring: true,
                    status: "COMPLETED",
                    OR: [
                        {lastProcessed: null}, //Never lastProcessed
                        {nextRecurringDate: {lte: new Date()}}, // due date passed
                    ],
                },
            });
        }
    );

        //2 Create Transactions for each Transactions
        if (recurringTransactions.length > 0) {
            const events = recurringTransactions.map((transaction) => ({
                name: "transaction.recurring.process",
                data: {transactionId: transaction.id, userId: transaction.userId},
            }));

            // 3 Send events to be processed
            await inngest.send(events);
        }

        return { triggered: recurringTransactions.length};
  }
);

export const processedRecurringTransaction = inngest.createFunction(
    {
        id: "process-recurring-transaction",
        throttle: {
            limit: 10,
            period: "1m",
            key: "event.data.userId",
        },
    },
    {event: "transaction.recurring.process"},
    async ({event, step }) => {
        if(!event?.data?.transactionId || !event?.data?.userId) {
            console.error("Invalid event data:", event);
            return {error: "Missing required event data"};
        }
        await step.run("process-transaction", async () => {
            const transaction = await db.transaction.findUnique({
                where: {
                    id: event.data.transactionId,
                    userId: event.data.userId,

                },
                include: {
                    account: true, 
                },
            });

            if (!transaction || !isTransactionDue(transaction)) return;

            await db.$transaction(async (tx) => {
                //Create new Transactions
                await tx.transaction.create({
                    data: {
                        type: transaction.type,
                        amount: transaction.amount,
                        description : `${transaction.description} (Recurring)`,
                        date: new Date(),
                        category: transaction.category,
                        userId: transaction.userId,
                        accountId: transaction.accountId,
                        isRecurring: false,
                    },
                });

                //Update account balance
                const balanceChange = 
                transaction.type === "EXPENSE"
                ? -transaction.amount.toNumber()
                : transaction.amount.toNumber();

                await tx.account.update({
                    where: {id: transaction.accountId},
                    data: {balance: {increment: balanceChange}},
                });

                //Update last processed data and next recurring Date
                await tx.transaction.update({
                    where: {id: transaction.id},
                    data: {
                        lastProcessed: new Date(),
                        nextRecurringDate: calculateNextRecurringDate(
                            new Date(),
                            transaction.recurringInterval
                        ),
                    },
                });
            });
        });
    }
);

function isTransactionDue(transaction) {
    if (!transaction.lastProcessed) return true; 
    

    const today = new Date();
    const nextDue = new Date(transaction.nextRecurringDate);

    return nextDue <= today;
}


function calculateNextRecurringDate(startDate, interval) {
    const date = new Date(startDate);

    switch (interval) {
        case "DAILY":
            date.setDate(date.getDate()+1);
            break;
        
        case "WEEKLY":
            date.setDate(date.getDate()+7);
            break;

        case "MONTHLY":
            date.setMonth(date.getMonth()+1);
            break;

        case "YEARLY":
            date.setFullYear(date.getFullYear()+1);
            break;
    }
    return date;
}

export const generateMonthlyReports = inngest.createFunction(
    {
        id: "generate-monthky-reports",
        name: "Generate Monthly Reports",
    },
    {cron: "0 0 1 * *" },
    async({step}) =>{ const users = await step.run("fetch-users", async() => {
        return await db.user.findMany({
            include: {accounts: true},
        });
    });

    for(const user of users) {
        await step.run(`generate-report-${user.id}`, async () => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);

            const stats = await getMonthlyStats(user.id, lastMonth);
            const monthName = lastMonth.toLocaleString("default", {month: "long", });


            const insights = await generateFinancialInsights(
                stats,
                monthName
            );

            await sendEmail({
                to: user.email,
                subject: `Your Monthly Financial Report - ${monthName}`,
                react : EmailTemplate({
                    userName: user.name,
                    type: "monthly-report",
                    data: {
                        stats,
                        month: monthName,
                        insights,
                    },
                }),
            });
            
        });
    }
    return {processed: users.length};
    }
);

export const sendBillReminders = inngest.createFunction(
  {
    id: "send-bill-reminders",
    name: "Send Bill Reminders",
  },
  { cron: "0 4 * * *" },
  async ({ step }) => {
    const REMINDER_WINDOW_DAYS = 7;
    const DAY_IN_MS = 1000 * 60 * 60 * 24;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const windowEnd = new Date(todayStart);
    windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

    const bills = await step.run("fetch-bills", async () => {
      return await db.bill.findMany({
        where: {
          status: {
            notIn: ["PAID", "SKIPPED"],
          },
        },
        include: { user: true },
      });
    });

    const recurringTransactions = await step.run("fetch-recurring-transactions-for-reminder", async () => {
      return await db.transaction.findMany({
        where: {
          isRecurring: true,
          status: "COMPLETED",
          nextRecurringDate: {
            gte: todayStart,
            lte: windowEnd,
          },
        },
        include: { user: true },
      });
    });

    const remindersByUser = new Map();

    const addReminder = (user, item) => {
      if (!user?.email) return;
      if (!remindersByUser.has(user.id)) {
        remindersByUser.set(user.id, {
          user,
          items: [],
          billUpdates: [],
          recurringTxIds: new Set(),
        });
      }
      remindersByUser.get(user.id).items.push(item);
    };

    for (const bill of bills) {
      const nextDue = new Date(bill.nextDueDate);
      const daysUntilDue = Math.ceil((nextDue.getTime() - todayStart.getTime()) / DAY_IN_MS);
      const reminderOffsets = Array.isArray(bill.reminderDays) && bill.reminderDays.length > 0
        ? bill.reminderDays
        : [7, 3, 1, 0];
      const sentOffsets = Array.isArray(bill.sentReminderOffsets) ? bill.sentReminderOffsets : [];

      if (nextDue < todayStart) {
        const lastOverdueReminder = bill.lastOverdueReminderSent
          ? new Date(bill.lastOverdueReminderSent)
          : null;
        if (!lastOverdueReminder || lastOverdueReminder < todayStart) {
          addReminder(bill.user, {
            name: bill.name,
            amount: `₹${Number(bill.amount).toFixed(0)}`,
            dueDate: nextDue.toLocaleDateString("en-IN"),
            status: bill.isAutoPay ? "Overdue auto-pay check" : "Overdue",
          });
          if (remindersByUser.has(bill.userId)) {
            remindersByUser.get(bill.userId).billUpdates.push({
              id: bill.id,
              overdue: true,
              offset: null,
            });
          }
        }
        continue;
      }

      if (nextDue > windowEnd) continue;

      if (reminderOffsets.includes(daysUntilDue) && !sentOffsets.includes(daysUntilDue)) {
        addReminder(bill.user, {
          name: bill.name,
          amount: `₹${Number(bill.amount).toFixed(0)}`,
          dueDate: nextDue.toLocaleDateString("en-IN"),
          status: bill.isAutoPay ? `Auto-pay in ${daysUntilDue} day(s)` : `Due in ${daysUntilDue} day(s)`,
        });
        if (remindersByUser.has(bill.userId)) {
          remindersByUser.get(bill.userId).billUpdates.push({
            id: bill.id,
            overdue: false,
            offset: daysUntilDue,
          });
        }
      }
    }

    for (const tx of recurringTransactions) {
      if (tx.lastReminderSent && tx.lastReminderSent >= todayStart) continue;
      addReminder(tx.user, {
        name: tx.description || "Recurring transaction",
        amount: `₹${Number(tx.amount).toFixed(0)}`,
        dueDate: tx.nextRecurringDate
          ? new Date(tx.nextRecurringDate).toLocaleDateString("en-IN")
          : "Upcoming",
      });
      if (remindersByUser.has(tx.userId)) {
        remindersByUser.get(tx.userId).recurringTxIds.add(tx.id);
      }
    }

    for (const entry of remindersByUser.values()) {
      const { user, items } = entry;
      if (!items.length) continue;

      await sendEmail({
        to: user.email,
        subject: "Upcoming bill reminders",
        react: EmailTemplate({
          userName: user.name || "",
          type: "bill-reminder",
          data: {
            bills: items,
          },
        }),
      });

      for (const update of entry.billUpdates) {
        const existing = await db.bill.findUnique({
          where: { id: update.id },
          select: { sentReminderOffsets: true },
        });

        await db.bill.update({
          where: { id: update.id },
          data: update.overdue
            ? {
                status: "OVERDUE",
                lastOverdueReminderSent: new Date(),
              }
            : {
                status: "PENDING",
                lastReminderSent: new Date(),
                sentReminderOffsets: Array.from(
                  new Set([...(existing?.sentReminderOffsets || []), update.offset])
                ),
              },
        });
      }

      const recurringTxIds = Array.from(entry.recurringTxIds);
      if (recurringTxIds.length > 0) {
        await db.transaction.updateMany({
          where: { id: { in: recurringTxIds } },
          data: { lastReminderSent: new Date() },
        });
      }
    }

    return { usersNotified: remindersByUser.size };
  }
);

async function generateFinancialInsights(stats, month) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
    
    const prompt = `Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${getCategoryName(category)}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]`;
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating insights:", error);
        return[
            "Your highest expense category this month might need attention.",
            "Consider setting up a budget for better financial management.",
            "Track your recurring expenses to identify potential savings.",
        ];
    }
}

const getMonthlyStats = async (userId , month) => {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const transactions = await db.transaction.findMany({
        where: {
            userId, 
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    return transactions.reduce((
        stats,t
    ) => {
        const amount = t.amount.toNumber();
        if(t.type === "EXPENSE") {
            stats.totalExpenses += amount;
            const categoryId = normalizeCategoryId(t.category);
            stats.byCategory[categoryId] =
            (stats.byCategory[categoryId] || 0) + amount;
        }else{
            stats.totalIncome += amount;

        }
        return stats;
    },
{
    totalExpenses : 0,
    totalIncome: 0,
    byCategory: {},
    transactionCount: transactions.length,
});

};
