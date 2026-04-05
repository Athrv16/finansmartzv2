import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import TransactionTable from "../_components/transaction-table";
import AccountChart from "../_components/account-chart";
import ExportCenter from "../../dashboard/_components/export-center";
import { BarLoader } from "react-spinners";
import { ArrowDownRight, ArrowUpRight, Landmark, HeartPulse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AccountPage = async ({ params }) => {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;
  const income = transactions
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expense = transactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const now = new Date();
  const startCurrent = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const startPrevious = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59);
  const endPrevious = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

  const currentWindow = transactions.filter(
    (tx) => new Date(tx.date) >= startCurrent && new Date(tx.date) <= now
  );
  const previousWindow = transactions.filter(
    (tx) => new Date(tx.date) >= startPrevious && new Date(tx.date) <= endPrevious
  );

  const sumByType = (items, type) =>
    items.filter((tx) => tx.type === type).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const currentIncome = sumByType(currentWindow, "INCOME");
  const currentExpense = sumByType(currentWindow, "EXPENSE");
  const previousIncome = sumByType(previousWindow, "INCOME");
  const previousExpense = sumByType(previousWindow, "EXPENSE");

  const currentNet = currentIncome - currentExpense;
  const previousNet = previousIncome - previousExpense;
  const cashflowDelta = currentNet - previousNet;

  const expenseAmounts = currentWindow
    .filter((tx) => tx.type === "EXPENSE")
    .map((tx) => Number(tx.amount || 0));

  const meanExpense =
    expenseAmounts.length > 0
      ? expenseAmounts.reduce((sum, value) => sum + value, 0) / expenseAmounts.length
      : 0;

  const variance =
    expenseAmounts.length > 1
      ? expenseAmounts.reduce((sum, value) => sum + Math.pow(value - meanExpense, 2), 0) /
        (expenseAmounts.length - 1)
      : 0;

  const volatility = Math.sqrt(variance);
  const volatilityScore = meanExpense > 0 ? Math.max(0, 100 - (volatility / meanExpense) * 100) : 50;

  const recurringExpense = currentWindow
    .filter((tx) => tx.type === "EXPENSE" && tx.isRecurring)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const recurringBurden = currentIncome > 0 ? recurringExpense / currentIncome : 0;
  const burdenScore = currentIncome > 0 ? Math.max(0, 100 - recurringBurden * 100) : 50;

  const cashflowScore = Math.max(0, Math.min(100, 50 + (cashflowDelta / Math.max(1, currentExpense)) * 50));
  const healthScore = Math.round(
    0.4 * cashflowScore + 0.35 * volatilityScore + 0.25 * burdenScore
  );
  const healthLabel =
    healthScore >= 80 ? "Healthy" : healthScore >= 60 ? "Stable" : healthScore >= 40 ? "Watch" : "Risk";
  const healthColor =
    healthScore >= 80
      ? "text-emerald-600"
      : healthScore >= 60
      ? "text-blue-600"
      : healthScore >= 40
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="space-y-8 px-5 pb-8 animate-fade-in" style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-all duration-500 ease-out hover:shadow-xl">
        <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-blue-200/40 blur-2xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-title">Account Overview</p>
          <h1 className="mb-3 mt-2 text-4xl font-black tracking-tight md:text-5xl bg-gradient-to-r from-blue-600 to-slate-900 bg-clip-text text-transparent">
            {account.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Card className="bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-lg font-semibold">₹{parseFloat(account.balance).toFixed(2)}</p>
              </div>
              <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </CardContent>
          </Card>
          <Card className="bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="text-lg font-semibold text-emerald-600">₹{income.toFixed(2)}</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            </CardContent>
          </Card>
          <Card className="bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Expense</p>
                <p className="text-lg font-semibold text-red-600">₹{expense.toFixed(2)}</p>
              </div>
              <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-300" />
            </CardContent>
          </Card>
          <Card className="bg-white/80 shadow-sm dark:bg-slate-900/70 transition-transform duration-300 hover:scale-105 hover:shadow-lg">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">Account Health</p>
                <p className={`text-lg font-semibold ${healthColor}`}>
                  {healthScore} • {healthLabel}
                </p>
              </div>
              <HeartPulse className={`h-5 w-5 ${healthColor}`} />
            </CardContent>
          </Card>
        </div>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Activity</p>
        <div className="text-right">
          <div className="text-xl sm:text-2xl font-bold">
            ₹{parseFloat(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">{transactions.length} Transactions</p>
        </div>
      </div>

      <Suspense fallback={<BarLoader width="100%" color="#9333ea" />}>
        <AccountChart transactions={transactions} />
      </Suspense>

      <ExportCenter />

      <Suspense fallback={<BarLoader width="100%" color="#9333ea" />}>
        <TransactionTable transactions={transactions} />
      </Suspense>
      </div>
    );
};


// Add keyframes for fadeIn and slideUp
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideUp {
      0% { opacity: 0; transform: translateY(40px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

export default AccountPage;
