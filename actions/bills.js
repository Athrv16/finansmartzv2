"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const coerceFormData = (data) => {
  if (!(data instanceof FormData)) return data;
  return {
    name: data.get("name"),
    amount: data.get("amount"),
    dueDate: data.get("dueDate"),
    isRecurring: data.get("isRecurring") === "on",
    recurringInterval: data.get("recurringInterval") || null,
  };
};

export async function createBill(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const payload = coerceFormData(data);
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const dueDate = new Date(payload?.dueDate);
  if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid due date");

  const created = await db.bill.create({
    data: {
      name: payload.name,
      amount: Number(payload.amount || 0),
      dueDate,
      nextDueDate: dueDate,
      isRecurring: Boolean(payload.isRecurring),
      recurringInterval: payload.isRecurring ? payload.recurringInterval || null : null,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bill-reminders");
  return created;
}

export async function updateBill(id, data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const update = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.amount !== undefined) update.amount = Number(data.amount || 0);
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid due date");
    update.dueDate = dueDate;
    update.nextDueDate = dueDate;
  }
  if (data.isRecurring !== undefined) update.isRecurring = Boolean(data.isRecurring);
  if (data.recurringInterval !== undefined) update.recurringInterval = data.recurringInterval || null;

  const updated = await db.bill.update({
    where: { id, userId: user.id },
    data: update,
  });

  revalidatePath("/dashboard");
  revalidatePath("/bill-reminders");

  return updated;
}

export async function deleteBill(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  await db.bill.delete({
    where: { id, userId: user.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/bill-reminders");
  return { success: true };
}

export async function getBills() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found");

  const bills = await db.bill.findMany({
    where: { userId: user.id },
    orderBy: { nextDueDate: "asc" },
  });

  return bills.map((bill) => ({
    ...bill,
    amount: bill.amount?.toNumber ? bill.amount.toNumber() : Number(bill.amount || 0),
    dueDate: bill.dueDate?.toISOString ? bill.dueDate.toISOString() : bill.dueDate,
    nextDueDate: bill.nextDueDate?.toISOString ? bill.nextDueDate.toISOString() : bill.nextDueDate,
    createdAt: bill.createdAt?.toISOString ? bill.createdAt.toISOString() : bill.createdAt,
    updatedAt: bill.updatedAt?.toISOString ? bill.updatedAt.toISOString() : bill.updatedAt,
    lastReminderSent: bill.lastReminderSent?.toISOString
      ? bill.lastReminderSent.toISOString()
      : bill.lastReminderSent,
  }));
}
