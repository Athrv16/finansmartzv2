export const runtime = "nodejs";

import { currentUser } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.readonly"],
    state: user.id, // 🔥 THIS IS IMPORTANT
  });

  return NextResponse.redirect(authUrl);
}
