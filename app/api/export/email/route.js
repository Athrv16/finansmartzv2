import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";

const toCsv = (rows) => {
  const headers = [
    "id",
    "date",
    "type",
    "amount",
    "description",
    "category",
    "account",
    "isRecurring",
    "recurringInterval",
    "nextRecurringDate",
    "status",
  ];

  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = rows.map((row) =>
    headers.map((header) => escape(row[header])).join(",")
  );

  return [headers.join(","), ...lines].join("\n");
};

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    include: { account: true },
    orderBy: { date: "desc" },
  });

  const rows = transactions.map((tx) => ({
    id: tx.id,
    date: tx.date.toISOString(),
    type: tx.type,
    amount: tx.amount?.toNumber ? tx.amount.toNumber() : Number(tx.amount || 0),
    description: tx.description || "",
    category: tx.category || "",
    account: tx.account?.name || "",
    isRecurring: tx.isRecurring ? "true" : "false",
    recurringInterval: tx.recurringInterval || "",
    nextRecurringDate: tx.nextRecurringDate ? tx.nextRecurringDate.toISOString() : "",
    status: tx.status || "",
  }));

  const csv = toCsv(rows);
  const csvBase64 = Buffer.from(csv, "utf-8").toString("base64");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`;
  const url = new URL(req.url);
  const origin = appUrl || `${url.protocol}//${url.host}`;
  const exportLink = `${origin}/api/export/transactions?format=csv`;

  const result = await sendEmail({
    to: email,
    subject: "Your Finansmartz export is ready",
    react: (
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: "14px", color: "#0f172a" }}>
        <p>Hi there,</p>
        <p>Your transaction export is ready. Click the link below to download:</p>
        <p>
          <a href={exportLink} style={{ color: "#2563eb" }}>
            Download CSV
          </a>
        </p>
        <p>If you did not request this email, you can ignore it.</p>
      </div>
    ),
    attachments: [
      {
        filename: "transactions-export.csv",
        content: csvBase64,
      },
    ],
  });

  if (!result?.success) {
    return Response.json(
      { error: "Failed to send email", details: result?.error?.message || null },
      { status: 500 }
    );
  }

  return Response.json({ success: true, link: exportLink });
}
