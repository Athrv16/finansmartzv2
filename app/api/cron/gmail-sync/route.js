export const runtime = "nodejs";

import { google } from "googleapis";
import { upiDb } from "@/lib/upi-db";
import { db as prisma } from "@/lib/prisma";
import { fetchBankEmails, extractEmailBody } from "@/lib/gmailClient";
import { parseBankEmail } from "@/lib/upi-parser";

export async function POST(req) {
  try {

    // 🔐 Protect cron
    const authHeader = req.headers.get("authorization");

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ⭐ Include last_synced_at
    const connections = await upiDb.query(`
      SELECT user_id, access_token, refresh_token, last_synced_at
      FROM upi_connections
    `);

    let totalInserted = 0;
    let totalErrors = 0;

    for (const conn of connections.rows) {

      try {

        const oauthClient = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauthClient.setCredentials({
          access_token: conn.access_token,
          refresh_token: conn.refresh_token,
        });

        const gmail = google.gmail({ version: "v1", auth: oauthClient });

        // ⭐ Incremental Gmail fetch
        const messages = await fetchBankEmails(
          oauthClient,
          conn.last_synced_at
        );

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

            // ⭐ Insert into Neon
            const res = await upiDb.query(`
              INSERT INTO upi_transactions
              (user_id, amount, type, merchant, upi_ref, raw_hash, email_message_id)
              VALUES ($1,$2,$3,$4,$5,$6,$7)
              ON CONFLICT (raw_hash) DO NOTHING
            `, [
              conn.user_id,
              parsed.amount,
              parsed.type,
              parsed.merchant,
              parsed.reference,
              parsed.rawHash,
              msg.id,
            ]);

            if (res.rowCount > 0) {

              totalInserted++;

              // ⭐ Sync Supabase balance
              try {

                const supabaseUser = await prisma.user.findUnique({
                  where: { clerkUserId: conn.user_id },
                });

                if (!supabaseUser) continue;

                const account = await prisma.account.findFirst({
                  where: {
                    userId: supabaseUser.id,
                    isDefault: true,
                  },
                });

                if (!account) continue;

                await prisma.account.update({
                  where: { id: account.id },
                  data: {
                    balance: {
                      increment:
                        parsed.type === "CREDIT"
                          ? parsed.amount
                          : -parsed.amount,
                    },
                  },
                });

              } catch (balanceErr) {
                console.error("[BALANCE SYNC ERROR]", balanceErr.message);
              }
            }

          } catch (emailErr) {
            totalErrors++;
            console.error("[CRON EMAIL ERROR]", emailErr.message);
          }
        }

        // ⭐ Update last sync time AFTER user sync finishes
        await upiDb.query(`
          UPDATE upi_connections
          SET last_synced_at = NOW()
          WHERE user_id = $1
        `, [conn.user_id]);

      } catch (userErr) {
        totalErrors++;
        console.error("[CRON USER ERROR]", userErr.message);
      }
    }

    // ⭐ Import Neon → Supabase
    try {

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/upi/import`, {
        method: "POST"
      });

    } catch (importErr) {
      console.error("[IMPORT ERROR]", importErr.message);
    }

    return Response.json({
      success: true,
      totalInserted,
      totalErrors,
    });

  } catch (fatalErr) {

    console.error("[CRON FATAL]", fatalErr.message);

    return Response.json(
      { error: "Cron failed", message: fatalErr.message },
      { status: 500 }
    );
  }
}
