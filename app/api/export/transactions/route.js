import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

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

const toPdf = (rows) => {
  const escapePdfText = (value) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const lines = [
    "Transaction Export",
    "",
    ...rows.map(
      (row) =>
        `${row.date} | ${row.type} | ₹${row.amount} | ${row.category} | ${row.description}`
    ),
  ];

  const contentLines = lines.map(
    (line) => `(${escapePdfText(line)}) Tj\n0 -14 Td`
  );

  const contentStream = `BT\n/F1 10 Tf\n50 780 Td\n${contentLines.join(
    "\n"
  )}\nET`;

  const objects = [];
  const offsets = [];

  const pushObject = (content) => {
    offsets.push(objects.join("").length);
    objects.push(content);
  };

  pushObject("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  pushObject(
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
  );
  pushObject(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n"
  );
  pushObject(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  );
  pushObject(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  );

  const xrefStart = objects.join("").length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return `%PDF-1.4\n${objects.join("")}${xref}${trailer}`;
};

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();

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

  if (format === "pdf") {
    const pdf = toPdf(rows);
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="transactions-export.pdf"`,
      },
    });
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-export.csv"`,
    },
  });
}
