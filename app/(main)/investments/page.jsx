import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { Badge } from "@/components/ui/badge";
import InvestmentRecommendationsToggle from "./_components/investment-recommendations-toggle";

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;
const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default async function InvestmentsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [transactions, accounts] = await Promise.all([getDashboardData(), getUserAccounts()]);

  const investmentTransactions = transactions.filter((tx) => {
    const category = String(tx.category || "").toLowerCase();
    return category.includes("investment");
  });

  const totalAccounts = accounts.length;
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const investmentInflows = investmentTransactions
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const investmentOutflows = investmentTransactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const netInvestmentFlow = investmentInflows - investmentOutflows;
  const deploymentRate = totalBalance > 0 ? (Math.abs(netInvestmentFlow) / totalBalance) * 100 : 0;
  const recurringInvestmentCount = investmentTransactions.filter((tx) => tx.isRecurring).length;

  const accountAllocation = accounts
    .map((account) => ({
      ...account,
      share: totalBalance > 0 ? (Number(account.balance || 0) / totalBalance) * 100 : 0,
    }))
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
    .slice(0, 5);

  const monthlyFlowMap = new Map();
  for (const tx of investmentTransactions) {
    const date = new Date(tx.date);
    const key = getMonthKey(date);
    if (!monthlyFlowMap.has(key)) {
      monthlyFlowMap.set(key, {
        key,
        label: date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        inflow: 0,
        outflow: 0,
      });
    }

    const bucket = monthlyFlowMap.get(key);
    if (tx.type === "INCOME") bucket.inflow += Number(tx.amount || 0);
    if (tx.type === "EXPENSE") bucket.outflow += Number(tx.amount || 0);
  }

  const monthlyFlow = Array.from(monthlyFlowMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);

  const dividendTransactions = investmentTransactions
    .filter((tx) => String(tx.description || "").toLowerCase().includes("dividend"))
    .slice(0, 5);

  const latestInvestmentTx = investmentTransactions[0] || null;
  const portfolioTone =
    netInvestmentFlow > 0 ? "Accumulating" : netInvestmentFlow < 0 ? "Deploying capital" : "Balanced";

  return (
    <div
      className="space-y-8 px-2 pt-6 md:px-0 animate-fade-in"
      style={{ animation: "fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)" }}
    >
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-500/10" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-teal-200/30 blur-2xl dark:bg-teal-500/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-title">Investments</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              <span className="bg-gradient-to-r from-emerald-600 to-slate-900 bg-clip-text text-transparent">
                Investment Portfolio
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A sharper view of investment cash flow, allocation, recurring contribution patterns, and tailored recommendation guidance.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white/85 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Net Investment Flow</p>
            <p className="mt-3 text-5xl font-black tracking-tight">{formatCurrency(netInvestmentFlow)}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">{portfolioTone}</Badge>
              <span className="text-xs text-muted-foreground">
                {investmentTransactions.length} tracked investment entries
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Investment Income</p>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{formatCurrency(investmentInflows)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Income classified under investment activity.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Capital Deployed</p>
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{formatCurrency(investmentOutflows)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Money moved into investment positions.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recurring Contributions</p>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{recurringInvestmentCount}</p>
          <p className="mt-1 text-sm text-muted-foreground">Investment transactions already running on repeat.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Portfolio Accounts</p>
            <Landmark className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{totalAccounts}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalAccounts > 0 ? "Allocation is estimated from your connected account balances." : "Add an account to begin tracking portfolio spread."}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <p className="section-title">Allocation</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Where your money sits today</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This uses current account balances as a simple portfolio mix proxy until dedicated holdings are added.
          </p>

          <div className="mt-5 space-y-4">
            {accountAllocation.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-700/80 dark:bg-slate-900/50">
                No accounts available yet. Create an account first to unlock allocation and portfolio spread insights.
              </div>
            ) : accountAllocation.map((account, index) => (
              <div key={account.id} className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{account.name}</p>
                      {index === 0 ? <Badge variant="outline">Largest holding</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{account.type}</p>
                  </div>
                  <Badge variant="outline">{account.share.toFixed(0)}%</Badge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${account.share}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatCurrency(account.balance)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <p className="section-title">Health</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Portfolio operating signals</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold">Deployment rate</p>
                </div>
                <p className="mt-3 text-2xl font-black">{deploymentRate.toFixed(0)}%</p>
                <p className="mt-1 text-sm text-muted-foreground">Net flow compared with current total balances.</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold">Dividend activity</p>
                </div>
                <p className="mt-3 text-2xl font-black">{dividendTransactions.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">Recent dividend-like cash entries detected.</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2">
                  <WalletCards className="h-4 w-4 text-emerald-600" />
                  <p className="font-semibold">Total balance base</p>
                </div>
                <p className="mt-3 text-2xl font-black">{formatCurrency(totalBalance)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Current connected account value used by this page.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <p className="font-semibold">Latest investment event</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {latestInvestmentTx?.description || latestInvestmentTx?.category || "No recent investment transaction"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latestInvestmentTx ? `${formatCurrency(latestInvestmentTx.amount)} on ${new Date(latestInvestmentTx.date).toLocaleDateString("en-IN")}` : "Add investment-tagged transactions to populate this panel."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <p className="section-title">Activity</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Recent investment signals</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold">Monthly flow trend</p>
                </div>
                <div className="mt-4 grid gap-3">
                  {monthlyFlow.length > 0 ? monthlyFlow.map((item) => (
                    <div key={item.key} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm dark:bg-slate-950/40">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">
                        In {formatCurrency(item.inflow)} / Out {formatCurrency(item.outflow)}
                      </span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No investment flow history yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <p className="font-semibold">Recent dividend-like income</p>
                </div>
                <div className="mt-4 space-y-2">
                  {dividendTransactions.length > 0 ? dividendTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm dark:bg-slate-950/40">
                      <span>{tx.description || "Investment income"}</span>
                      <span className="text-muted-foreground">{formatCurrency(tx.amount)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No dividend-style transactions found yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <InvestmentRecommendationsToggle />
    </div>
  );
}
