export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { upiDb } from "@/lib/upi-db";
import { db as prisma } from "@/lib/prisma";
import { inferUpiCategory } from "@/lib/upi-category";

export async function POST() {
  try {
    // 🔐 Clerk Auth
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⭐ Find Supabase user using Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ⭐ Get default account
    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        isDefault: true
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: "No default account found" },
        { status: 400 }
      );
    }

    // ⭐ Fetch Neon UPI transactions
    const neonTx = await upiDb.query(
      `
      SELECT id, amount, type, merchant, transaction_time, created_at
      FROM upi_transactions
      WHERE user_id = $1
      `,
      [clerkUserId]
    );

    let inserted = 0;

    // ⭐ Loop Neon Transactions
    for (const tx of neonTx.rows) {
      try {

        const category = inferUpiCategory(
          tx.merchant || "",
          tx.type || "DEBIT"
        );

        // ⭐ UPSERT → prevents duplicates completely
        const result = await prisma.transaction.upsert({
          where: {
            upiTransactionId: tx.id
          },
          update: {}, // Do nothing if already exists
          create: {
            type: tx.type === "DEBIT" ? "EXPENSE" : "INCOME",

            amount: Number(tx.amount),

            description: tx.merchant || "UPI Transaction",

            date:
              tx.transaction_time ||
              tx.created_at ||
              new Date(),

            category: category || "other-expense",

            userId: user.id,
            accountId: account.id,

            upiTransactionId: tx.id
          }
        });

        // Count only if created (not updated)
        if (result) inserted++;

      } catch (txErr) {
        console.error("❌ Transaction Import Error:", txErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      inserted
    });

  } catch (err) {
    console.error("🔥 UPI Import Fatal Error:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
