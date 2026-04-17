export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { upiDb } from "@/lib/upi-db";
import { db as prisma } from "@/lib/prisma";
import {
  fetchBankEmails,
  extractEmailBody,
  isGmailAuthError,
} from "@/lib/gmailClient";
import { parseBankEmail } from "@/lib/upi-parser";
import {
  createUserCategoryModel,
  inferUpiCategory,
  selectCategoryTrainingExamples,
} from "@/lib/upi-category";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await upiDb.query(
      `
      SELECT user_id, access_token, refresh_token, last_synced_at, expiry
      FROM upi_connections
      WHERE user_id = $1
      `,
      [userId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "Gmail not connected" },
        { status: 400 }
      );
    }

    const conn = res.rows[0];
    const tokenExpired = conn.expiry && new Date(conn.expiry).getTime() <= Date.now();

    if (!conn.refresh_token || tokenExpired) {
      return NextResponse.json(
        {
          error: "Gmail connection expired",
          message: "Please reconnect Gmail and try syncing again.",
          code: "GMAIL_RECONNECT_REQUIRED",
        },
        { status: 401 }
      );
    }

    const oauthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    oauthClient.setCredentials({
      access_token: conn.access_token,
      refresh_token: conn.refresh_token,
    });

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "No default account found" },
        { status: 400 }
      );
    }

    const historicalTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        description: true,
        category: true,
        type: true,
        upiTransactionId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const categoryModel = createUserCategoryModel(
      selectCategoryTrainingExamples(historicalTransactions)
    );
    const gmail = google.gmail({ version: "v1", auth: oauthClient });
    const messages = await fetchBankEmails(oauthClient, conn.last_synced_at);
    const insertedTransactions = [];

    let inserted = 0;
    let parsedCount = 0;

    for (const msg of messages) {
      try {
        const msgData = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const body = extractEmailBody(msgData.data.payload);
        const parsed = parseBankEmail(body);
        if (!parsed) continue;
        parsedCount += 1;

        const insertRes = await upiDb.query(
          `
          INSERT INTO upi_transactions
          (user_id, amount, type, merchant, upi_ref, raw_hash, email_message_id)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (raw_hash) DO NOTHING
          RETURNING id, amount, type, merchant, transaction_time, created_at
          `,
          [
            conn.user_id,
            parsed.amount,
            parsed.type,
            parsed.merchant,
            parsed.reference,
            parsed.rawHash,
            msg.id,
          ]
        );

        if (insertRes.rowCount > 0) {
          inserted += 1;
          insertedTransactions.push(insertRes.rows[0]);
        }
      } catch (emailErr) {
        console.error(
          "[SYNC NOW][EMAIL ERROR]",
          msg.id,
          emailErr.status || "",
          emailErr.message
        );
      }
    }

    await upiDb.query(
      `
      UPDATE upi_connections
      SET last_synced_at = NOW()
      WHERE user_id = $1
      `,
      [conn.user_id]
    );

    let imported = 0;

    for (const tx of insertedTransactions) {
      try {
        const category = inferUpiCategory(
          tx.merchant || "",
          tx.type || "DEBIT",
          categoryModel
        );

        const result = await prisma.transaction.upsert({
          where: {
            upiTransactionId: tx.id,
          },
          update: {},
          create: {
            type: tx.type === "DEBIT" ? "EXPENSE" : "INCOME",
            amount: Number(tx.amount),
            description: tx.merchant || "UPI Transaction",
            date: tx.transaction_time || tx.created_at || new Date(),
            category: category || "other-expense",
            userId: user.id,
            accountId: account.id,
            upiTransactionId: tx.id,
          },
        });

        if (result) imported += 1;
      } catch (txErr) {
        console.error("[SYNC NOW][IMPORT ERROR]", txErr.message);
      }
    }

    const importedTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        upiTransactionId: { not: null },
      },
      select: {
        id: true,
        description: true,
        type: true,
        category: true,
      },
    });

    let recategorized = 0;

    for (const tx of importedTransactions) {
      try {
        const nextCategory = inferUpiCategory(
          tx.description || "",
          tx.type,
          categoryModel
        );

        if (!nextCategory || nextCategory === tx.category) continue;

        await prisma.transaction.update({
          where: { id: tx.id },
          data: { category: nextCategory },
        });

        recategorized += 1;
      } catch (recategorizeErr) {
        console.error("[SYNC NOW][RECATEGORIZE ERROR]", tx.id, recategorizeErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      messageCount: messages.length,
      parsedCount,
      inserted,
      imported,
      recategorized,
    });
  } catch (err) {
    console.error("[SYNC NOW][FATAL]", err);

    if (isGmailAuthError(err)) {
      return NextResponse.json(
        {
          error: "Gmail connection expired",
          message: "Please reconnect Gmail and try syncing again.",
          code: "GMAIL_RECONNECT_REQUIRED",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Sync failed", message: err.message || String(err) },
      { status: 500 }
    );
  }
}
