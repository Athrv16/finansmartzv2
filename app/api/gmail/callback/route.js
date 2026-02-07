export const runtime = "nodejs";


import { google } from "googleapis";
import { NextResponse } from "next/server";
import { upiDb } from "@/lib/upi-db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.json({ error: "Invalid OAuth callback" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code);

  await upiDb.query(
    `
    INSERT INTO upi_connections
    (user_id, email, provider, access_token, refresh_token, expiry)
    VALUES ($1, $2, 'gmail', $3, $4, NOW() + INTERVAL '1 hour')
    ON CONFLICT (user_id, email)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expiry = EXCLUDED.expiry
    `,
    [
      userId,
      "gmail",
      tokens.access_token,
      tokens.refresh_token,
    ]
  );

 return NextResponse.redirect(new URL("/dashboard", req.url));

}
