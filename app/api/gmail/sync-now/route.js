export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { upiDb } from "@/lib/upi-db";
import { db as prisma } from "@/lib/prisma";
import { fetchBankEmails, extractEmailBody } from "@/lib/gmailClient";
import { parseBankEmail } from "@/lib/upi-parser";
import { inferUpiCategory } from "@/lib/upi-category";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await upiDb.query(
      `
      SELECT user_id, access_token, refresh_token, last_synced_at
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
    const oauthClient = new google.auth.OAuth2();
    oauthClient.setCredentials({
      access_token: conn.access_token,
      refresh_token: conn.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauthClient });
    const messages = await fetchBankEmails(oauthClient, conn.last_synced_at);

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

        if (insertRes.rowCount > 0) inserted += 1;
      } catch (emailErr) {
        console.error("[SYNC NOW][EMAIL ERROR]", emailErr.message);
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

    const neonTx = await upiDb.query(
      `
      SELECT id, amount, type, merchant, transaction_time, created_at
      FROM upi_transactions
      WHERE user_id = $1
      `,
      [userId]
    );

    let imported = 0;

    for (const tx of neonTx.rows) {
      try {
        const category = inferUpiCategory(
          tx.merchant || "",
          tx.type || "DEBIT"
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

    return NextResponse.json({
      success: true,
      messageCount: messages.length,
      parsedCount,
      inserted,
      imported,
    });
  } catch (err) {
    console.error("[SYNC NOW][FATAL]", err);
    return NextResponse.json(
      { error: "Sync failed", message: err.message || String(err) },
      { status: 500 }
    );
  }
}
