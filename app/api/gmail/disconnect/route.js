import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { upiDb } from "@/lib/upi-db";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ success: false });
  }

  await upiDb.query(
    `DELETE FROM upi_connections WHERE user_id = $1`,
    [userId]
  );

  return NextResponse.json({ success: true });
}
