"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import { readFile } from "fs/promises";
import path from "path";

const ACCOUNT_ID = "0f8a3942-3130-4ba6-b275-e393f299622c";
const USER_ID = "97e1787e-0d22-4284-899b-fe2a8477e460";

// Categories with their typical amount ranges
const CATEGORIES = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

// Helper to generate random amount within a range
function getRandomAmount(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

// Helper to get random category with amount
function getRandomCategory(type) {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

export async function seedTransactions() {
  try {
    // Generate 90 days of transactions
    const transactions = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const date = subDays(new Date(), i);

      // Generate 1-3 transactions per day
      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        // 40% chance of income, 60% chance of expense
        const type = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);

        const transaction = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${
            type === "INCOME" ? "Received" : "Paid for"
          } ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
        };

        totalBalance += type === "INCOME" ? amount : -amount;
        transactions.push(transaction);
      }
    }

    // Insert transactions in batches and update account balance
    await db.$transaction(async (tx) => {
      // Clear existing transactions
      await tx.transaction.deleteMany({
        where: { accountId: ACCOUNT_ID },
      });

      // Insert new transactions
      await tx.transaction.createMany({
        data: transactions,
      });

      // Update account balance
      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error: error.message };
  }
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
}

export async function seedFromCsvForUser({ overwrite = false } = {}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const existingAccounts = await db.account.findMany({
    where: { userId: user.id },
    select: { id: true },
  });

  if (existingAccounts.length > 0 && !overwrite) {
    return { success: true, skipped: true, message: "Accounts already exist" };
  }

  const accountsCsvPath = path.join(process.cwd(), "data", "seed", "accounts.csv");
  const transactionsCsvPath = path.join(
    process.cwd(),
    "data",
    "seed",
    "transactions.csv"
  );

  const [accountsRaw, transactionsRaw] = await Promise.all([
    readFile(accountsCsvPath, "utf8"),
    readFile(transactionsCsvPath, "utf8"),
  ]);

  const accountRows = parseCsv(accountsRaw);
  const transactionRows = parseCsv(transactionsRaw);

  if (accountRows.length === 0) {
    return { success: false, error: "No accounts found in CSV" };
  }

  if (overwrite) {
    await db.transaction.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
  }

  const accountIdByName = new Map();
  let defaultAssigned = false;

  for (const row of accountRows) {
    const isDefault = row.isDefault === "true" && !defaultAssigned;
    if (isDefault) defaultAssigned = true;

    const account = await db.account.create({
      data: {
        name: row.name,
        type: row.type,
        balance: Number(row.balance || 0),
        isDefault,
        userId: user.id,
      },
    });

    accountIdByName.set(row.name, account.id);
  }

  const transactions = transactionRows.map((row) => {
    const accountId = accountIdByName.get(row.accountName);
    if (!accountId) {
      throw new Error(`Unknown account name in CSV: ${row.accountName}`);
    }

    return {
      type: row.type,
      amount: Number(row.amount || 0),
      description: row.description || null,
      date: new Date(row.date),
      category: row.category,
      status: row.status || "COMPLETED",
      isRecurring: row.isRecurring === "true",
      recurringInterval: row.recurringInterval || null,
      userId: user.id,
      accountId,
    };
  });

  if (transactions.length > 0) {
    await db.transaction.createMany({ data: transactions });
  }

  const balanceChanges = new Map();
  for (const row of transactions) {
    const change = row.type === "EXPENSE" ? -row.amount : row.amount;
    balanceChanges.set(
      row.accountId,
      (balanceChanges.get(row.accountId) || 0) + change
    );
  }

  for (const [accountId, delta] of balanceChanges.entries()) {
    await db.account.update({
      where: { id: accountId },
      data: { balance: { increment: delta } },
    });
  }

  return {
    success: true,
    accounts: accountRows.length,
    transactions: transactions.length,
  };
}
