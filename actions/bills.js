"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_REMINDER_DAYS = [7, 3, 1, 0];

const calculateNextRecurringDate = (startDate, interval) => {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      break;
  }

  return date;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseReminderDays = (value) => {
  if (Array.isArray(value)) {
    const days = value.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item >= 0);
    return days.length ? Array.from(new Set(days)).sort((a, b) => b - a) : DEFAULT_REMINDER_DAYS;
  }

  if (typeof value !== "string") return DEFAULT_REMINDER_DAYS;

  const parsed = value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item >= 0);

  return parsed.length ? Array.from(new Set(parsed)).sort((a, b) => b - a) : DEFAULT_REMINDER_DAYS;
};

const parseStringList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseJsonField = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const roundCurrency = (value) => Number(Number(value || 0).toFixed(2));

const getResolvedStatus = (bill) => {
  if (bill.status === "PAID" || bill.status === "SKIPPED") return bill.status;
  if (bill.paidAmount && Number(bill.paidAmount) >= Number(bill.amount)) return "PAID";
  return new Date(bill.nextDueDate) < new Date() ? "OVERDUE" : "PENDING";
};

const serializeBill = (bill) => ({
  ...bill,
  amount: bill.amount?.toNumber ? bill.amount.toNumber() : Number(bill.amount || 0),
  estimatedAmount: bill.estimatedAmount?.toNumber
    ? bill.estimatedAmount.toNumber()
    : bill.estimatedAmount == null
      ? null
      : Number(bill.estimatedAmount),
  lastPaidAmount: bill.lastPaidAmount?.toNumber
    ? bill.lastPaidAmount.toNumber()
    : bill.lastPaidAmount == null
      ? null
      : Number(bill.lastPaidAmount),
  paidAmount: bill.paidAmount?.toNumber ? bill.paidAmount.toNumber() : Number(bill.paidAmount || 0),
  dueDate: bill.dueDate?.toISOString ? bill.dueDate.toISOString() : bill.dueDate,
  nextDueDate: bill.nextDueDate?.toISOString ? bill.nextDueDate.toISOString() : bill.nextDueDate,
  paidAt: bill.paidAt?.toISOString ? bill.paidAt.toISOString() : bill.paidAt,
  createdAt: bill.createdAt?.toISOString ? bill.createdAt.toISOString() : bill.createdAt,
  updatedAt: bill.updatedAt?.toISOString ? bill.updatedAt.toISOString() : bill.updatedAt,
  lastReminderSent: bill.lastReminderSent?.toISOString
    ? bill.lastReminderSent.toISOString()
    : bill.lastReminderSent,
  lastOverdueReminderSent: bill.lastOverdueReminderSent?.toISOString
    ? bill.lastOverdueReminderSent.toISOString()
    : bill.lastOverdueReminderSent,
  resolvedStatus: getResolvedStatus(bill),
});

const estimateNextAmount = (currentEstimate, previousActual, currentActual) => {
  const samples = [currentEstimate, previousActual, currentActual]
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);

  if (!samples.length) return currentActual ?? previousActual ?? null;

  const average = samples.reduce((sum, item) => sum + item, 0) / samples.length;
  return roundCurrency(average);
};

const appendHistoryEntry = (history, entry) => {
  const current = Array.isArray(history) ? history : [];
  return [entry, ...current].slice(0, 20);
};

const coerceFormData = (data) => {
  if (!(data instanceof FormData)) return data;

  return {
    name: data.get("name"),
    amount: data.get("amount"),
    estimatedAmount: data.get("estimatedAmount"),
    dueDate: data.get("dueDate"),
    isRecurring: data.get("isRecurring") === "on",
    recurringInterval: data.get("recurringInterval") || null,
    category: data.get("category") || null,
    priority: data.get("priority") || "ESSENTIAL",
    isAutoPay: data.get("isAutoPay") === "on",
    isVariableAmount: data.get("isVariableAmount") === "on",
    reminderDays: data.get("reminderDays"),
    notes: data.get("notes") || null,
    paymentProof: data.get("paymentProof") || null,
    sharedWith: data.get("sharedWith"),
    splitConfig: data.get("splitConfig"),
  };
};

const revalidateBills = () => {
  revalidatePath("/dashboard");
  revalidatePath("/bill-reminders");
};

const getCurrentUser = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
};

export async function createBill(data) {
  const user = await getCurrentUser();
  const payload = coerceFormData(data);
  const dueDate = normalizeDate(payload?.dueDate);

  if (!dueDate) throw new Error("Invalid due date");

  const created = await db.bill.create({
    data: {
      name: payload.name,
      amount: roundCurrency(payload.amount),
      estimatedAmount: payload.isVariableAmount ? roundCurrency(payload.estimatedAmount || payload.amount) : null,
      dueDate,
      nextDueDate: dueDate,
      isRecurring: Boolean(payload.isRecurring),
      recurringInterval: payload.isRecurring ? payload.recurringInterval || null : null,
      category: payload.category || null,
      priority: payload.priority || "ESSENTIAL",
      isAutoPay: Boolean(payload.isAutoPay),
      isVariableAmount: Boolean(payload.isVariableAmount),
      reminderDays: parseReminderDays(payload.reminderDays),
      notes: payload.notes || null,
      paymentProof: payload.paymentProof || null,
      sharedWith: parseStringList(payload.sharedWith),
      splitConfig: parseJsonField(payload.splitConfig),
      userId: user.id,
    },
  });

  revalidateBills();
  return created;
}

export async function updateBill(id, data) {
  const user = await getCurrentUser();

  const existing = await db.bill.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) throw new Error("Bill not found");

  const update = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.amount !== undefined) update.amount = roundCurrency(data.amount);
  if (data.estimatedAmount !== undefined) {
    update.estimatedAmount = data.estimatedAmount === "" || data.estimatedAmount == null
      ? null
      : roundCurrency(data.estimatedAmount);
  }
  if (data.dueDate !== undefined) {
    const dueDate = normalizeDate(data.dueDate);
    if (!dueDate) throw new Error("Invalid due date");
    update.dueDate = dueDate;
    update.nextDueDate = dueDate;
    update.sentReminderOffsets = [];
    update.lastReminderSent = null;
    update.lastOverdueReminderSent = null;
  }
  if (data.isRecurring !== undefined) update.isRecurring = Boolean(data.isRecurring);
  if (data.recurringInterval !== undefined) update.recurringInterval = data.recurringInterval || null;
  if (data.status !== undefined) update.status = data.status;
  if (data.category !== undefined) update.category = data.category || null;
  if (data.priority !== undefined) update.priority = data.priority || "ESSENTIAL";
  if (data.isAutoPay !== undefined) update.isAutoPay = Boolean(data.isAutoPay);
  if (data.isVariableAmount !== undefined) update.isVariableAmount = Boolean(data.isVariableAmount);
  if (data.reminderDays !== undefined) update.reminderDays = parseReminderDays(data.reminderDays);
  if (data.notes !== undefined) update.notes = data.notes || null;
  if (data.paymentProof !== undefined) update.paymentProof = data.paymentProof || null;
  if (data.sharedWith !== undefined) update.sharedWith = parseStringList(data.sharedWith);
  if (data.splitConfig !== undefined) update.splitConfig = parseJsonField(data.splitConfig);

  const updated = await db.bill.update({
    where: { id, userId: user.id },
    data: update,
  });

  revalidateBills();
  return updated;
}

export async function deleteBill(id) {
  const user = await getCurrentUser();

  await db.bill.delete({
    where: { id, userId: user.id },
  });

  revalidateBills();
  return { success: true };
}

export async function recordBillPayment(id, data = {}) {
  const user = await getCurrentUser();
  const bill = await db.bill.findFirst({
    where: { id, userId: user.id },
  });

  if (!bill) throw new Error("Bill not found");

  const paymentAmount = roundCurrency(data.amount ?? bill.amount);
  const nextPaidAmount = roundCurrency(Number(bill.paidAmount || 0) + paymentAmount);
  const fullyPaid = nextPaidAmount >= Number(bill.amount);
  const paidAt = normalizeDate(data.paidAt) || new Date();
  const historyEntry = {
    type: fullyPaid ? "PAID" : "PARTIAL",
    amount: paymentAmount,
    at: paidAt.toISOString(),
    note: data.note || null,
    paymentProof: data.paymentProof || bill.paymentProof || null,
  };

  if (bill.isRecurring && bill.recurringInterval && fullyPaid) {
    const nextDueDate = calculateNextRecurringDate(bill.nextDueDate, bill.recurringInterval);
    const updated = await db.bill.update({
      where: { id: bill.id, userId: user.id },
      data: {
        dueDate: nextDueDate,
        nextDueDate,
        status: "PENDING",
        paidAmount: 0,
        paidAt: null,
        lastPaidAmount: paymentAmount,
        estimatedAmount: bill.isVariableAmount
          ? estimateNextAmount(bill.estimatedAmount, bill.lastPaidAmount, paymentAmount)
          : bill.estimatedAmount,
        paymentProof: data.paymentProof || bill.paymentProof || null,
        paymentHistory: appendHistoryEntry(bill.paymentHistory, historyEntry),
        sentReminderOffsets: [],
        lastReminderSent: null,
        lastOverdueReminderSent: null,
      },
    });

    revalidateBills();
    return updated;
  }

  const updated = await db.bill.update({
    where: { id: bill.id, userId: user.id },
    data: {
      status: fullyPaid ? "PAID" : getResolvedStatus({ ...bill, paidAmount: nextPaidAmount }),
      paidAmount: nextPaidAmount,
      paidAt: fullyPaid ? paidAt : bill.paidAt,
      lastPaidAmount: fullyPaid ? paymentAmount : bill.lastPaidAmount,
      paymentProof: data.paymentProof || bill.paymentProof || null,
      paymentHistory: appendHistoryEntry(bill.paymentHistory, historyEntry),
    },
  });

  revalidateBills();
  return updated;
}

export async function skipBill(id, reason) {
  const user = await getCurrentUser();
  const bill = await db.bill.findFirst({
    where: { id, userId: user.id },
  });

  if (!bill) throw new Error("Bill not found");

  const historyEntry = {
    type: "SKIPPED",
    amount: 0,
    at: new Date().toISOString(),
    note: reason || null,
  };

  if (bill.isRecurring && bill.recurringInterval) {
    const nextDueDate = calculateNextRecurringDate(bill.nextDueDate, bill.recurringInterval);
    const updated = await db.bill.update({
      where: { id: bill.id, userId: user.id },
      data: {
        dueDate: nextDueDate,
        nextDueDate,
        status: "PENDING",
        paidAmount: 0,
        paidAt: null,
        missedPaymentCount: { increment: 1 },
        paymentHistory: appendHistoryEntry(bill.paymentHistory, historyEntry),
        sentReminderOffsets: [],
        lastReminderSent: null,
        lastOverdueReminderSent: null,
      },
    });

    revalidateBills();
    return updated;
  }

  const updated = await db.bill.update({
    where: { id: bill.id, userId: user.id },
    data: {
      status: "SKIPPED",
      missedPaymentCount: { increment: 1 },
      paymentHistory: appendHistoryEntry(bill.paymentHistory, historyEntry),
    },
  });

  revalidateBills();
  return updated;
}

export async function getBills() {
  const user = await getCurrentUser();

  const bills = await db.bill.findMany({
    where: { userId: user.id },
    orderBy: { nextDueDate: "asc" },
  });

  return bills.map(serializeBill);
}
