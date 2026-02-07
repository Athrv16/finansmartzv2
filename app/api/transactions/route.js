import { auth } from "@clerk/nextjs/server";
import { upiDb } from "@/lib/upi-db";

export async function GET(req) {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;

  const result = await upiDb.query(
    `
    SELECT
      id,
      amount,
      type,
      merchant,
      upi_ref,
      created_at
    FROM upi_transactions
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );

  return Response.json({
    transactions: result.rows,
  });
}
