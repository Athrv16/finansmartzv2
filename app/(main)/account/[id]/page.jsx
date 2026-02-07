import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import React, { Suspense } from "react";
import TransactionTable from "../_components/transaction-table";
import AccountChart from "../_components/account-chart";
import { BarLoader } from "react-spinners";
import { inferUpiCategory } from "@/lib/upi-category";


const AccountPage = async ({ params }) => {
  // ✅ App Router requires await
  const { id } = await params;

  // 1️⃣ Supabase account + transactions
  const accountData = await getAccountWithTransactions(id);
  if (!accountData) notFound();

  const { transactions: supabaseTx, ...account } = accountData;

  // 2️⃣ Build absolute URL safely (SERVER)
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol =
    process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  // 3️⃣ Fetch UPI transactions (Neon DB) — ✅ COOKIE FIX
  let upiTx = [];
  try {
    const cookie = headersList.get("cookie");

    const res = await fetch(
      `${baseUrl}/api/upi/transactions?accountId=${id}`,
      {
        cache: "no-store",
        headers: {
          cookie, // 🔥 THIS IS THE IMPORTANT FIX
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      upiTx = data.transactions || [];
    } else {
      console.error("UPI API failed:", await res.text());
    }
  } catch (err) {
    console.error("Failed to load UPI transactions", err);
  }

  // 4️⃣ Normalize UPI → existing transaction format
const normalizedUpiTx = upiTx.map(tx => ({
  id: `upi-${tx.id}`,               // important
  date: tx.transaction_time || tx.created_at,
  description: tx.merchant || "UPI Transaction",
  amount: Number(tx.amount),
  type: tx.type === "DEBIT" ? "EXPENSE" : "INCOME",
  category: inferUpiCategory(tx.merchant, tx.type), // ✅ CATEGORY ID
  isRecurring: false,
  recurringInterval: null,
  nextRecurringDate: null,
}));


  // 5️⃣ Merge Supabase + UPI
  const transactions = [...supabaseTx, ...normalizedUpiTx];

  return (
    <div className="space-y-8 px-5">
      {/* Header */}
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-6xl font-bold mb-5 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) +
              account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ₹{parseFloat(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {transactions.length} Transactions
          </p>
        </div>
      </div>

      {/* Chart */}
      <Suspense fallback={<BarLoader width="100%" color="#9333ea" />}>
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Table */}
      <Suspense fallback={<BarLoader width="100%" color="#9333ea" />}>
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
};

export default AccountPage;
