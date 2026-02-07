export const runtime = "nodejs";

import { google } from "googleapis";
import { upiDb } from "@/lib/upi-db";
import { fetchBankEmails, extractEmailBody } from "@/lib/gmailClient";

import { parseBankEmail } from "@/lib/upi-parser";

export async function POST(req) {
  try {
    // 🔐 Protect cron
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connectionsRes = await upiDb.query(`
      SELECT user_id, access_token, refresh_token
      FROM upi_connections
    `);

    let totalInserted = 0;
    let totalErrors = 0;

    for (const conn of connectionsRes.rows) {
      try {
        const oauthClient = new google.auth.OAuth2();
        oauthClient.setCredentials({
          access_token: conn.access_token,
          refresh_token: conn.refresh_token,
        });

        const gmail = google.gmail({ version: "v1", auth: oauthClient });

        const messages = await fetchBankEmails(oauthClient);

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

            const res = await upiDb.query(
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

            if (res.rowCount > 0) totalInserted++;
          } catch (emailErr) {
            totalErrors++;
            console.error(
              "[CRON][EMAIL ERROR]",
              conn.user_id,
              msg.id,
              emailErr.message
            );
          }
        }
      } catch (userErr) {
        totalErrors++;
        console.error(
          "[CRON][USER ERROR]",
          conn.user_id,
          userErr.message
        );
      }
    }

    // ✅ ALWAYS return JSON
    return Response.json({
      success: true,
      totalInserted,
      totalErrors,
    });
  } catch (fatalErr) {
    console.error("[CRON][FATAL]", fatalErr);
    return Response.json(
      { error: "Cron failed", message: fatalErr.message },
      { status: 500 }
    );
  }
}
