import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { upiDb } from "@/lib/upi-db";

export async function GET() {
  const { userId } = auth();

  const res = await upiDb.query(
    "SELECT * FROM upi_connections WHERE user_id=$1",
    [userId]
  );

  if (res.rowCount === 0) {
    return Response.json({ error: "Gmail not connected" }, { status: 400 });
  }

  const conn = res.rows[0];

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const messages = await gmail.users.messages.list({
    userId: "me",
    maxResults: 5,
  });

  return Response.json({
    success: true,
    messageCount: messages.data.messages?.length || 0,
  });
}
