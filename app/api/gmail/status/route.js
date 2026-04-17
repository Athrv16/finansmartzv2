import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { upiDb } from "@/lib/upi-db";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ connected: false });
    }

    const res = await upiDb.query(
      `SELECT id, refresh_token, expiry FROM upi_connections WHERE user_id = $1`,
      [userId]
    );

    const connection = res.rows[0];
    const expired =
      !connection ||
      !connection.refresh_token ||
      (connection.expiry && new Date(connection.expiry).getTime() <= Date.now());

    return NextResponse.json({
      connected: !expired,
      expired,
    });
  } catch (error) {
    console.error("Gmail status check failed:", error);
    return NextResponse.json({
      connected: false
    });
  }
}
