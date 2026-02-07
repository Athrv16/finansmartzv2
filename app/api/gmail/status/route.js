import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { upiDb } from "@/lib/upi-db";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ connected: false });
  }

  const res = await upiDb.query(
    `SELECT id FROM upi_connections WHERE user_id = $1`,
    [userId]
  );

  return NextResponse.json({
    connected: res.rowCount > 0
  });
}
