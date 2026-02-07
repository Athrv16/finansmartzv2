export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { upiDb } from "@/lib/upi-db";
import { auth } from "@clerk/nextjs/server";

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId" },
      { status: 400 }
    );
  }

  try {
    const result = await upiDb.query(
      `
      SELECT
        id,
        amount,
        type,
        merchant,
        transaction_time,
        created_at
      FROM upi_transactions
      WHERE user_id = $1
      ORDER BY transaction_time DESC
      `,
      [userId]
    );

    return NextResponse.json({
      transactions: result.rows,
    });
  } catch (err) {
    console.error("UPI fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch UPI transactions" },
      { status: 500 }
    );
  }
}
