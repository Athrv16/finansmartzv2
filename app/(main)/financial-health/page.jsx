import React from "react";
import { AlertTriangle, ArrowUpRight, BadgeIndianRupee, CheckCircle2, HeartPulse, ShieldCheck } from "lucide-react";
import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { getBills } from "@/actions/bills";
import { Badge } from "@/components/ui/badge";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

const getMonthBounds = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
};

export default async function FinancialHealthPage() {
  const [accounts, transactions, bills] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
    getBills(),
  ]);

  const defaultAccount = accounts.find((account) => account.isDefault);
  const budgetData = defaultAccount ? await getCurrentBudget(defaultAccount.id) : null;

  const { start, end } = getMonthBounds();
  const monthlyTransactions = transactions.filter((tx) => {
    const date = new Date(tx.date);
    return date >= start && date <= end;
  });

  const income = monthlyTransactions
    .filter((tx) => tx.type === "INCOME")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expenses = monthlyTransactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const overdueBills = bills.filter((bill) => (bill.resolvedStatus || bill.status) === "OVERDUE");
  const paidBills = bills.filter((bill) => (bill.resolvedStatus || bill.status) === "PAID");
  const billDisciplineRate = bills.length > 0 ? (paidBills.length / bills.length) * 100 : 100;
  const expenseCoverageMonths = expenses > 0 ? totalBalance / expenses : 0;
  const budgetAmount = Number(budgetData?.budget?.amount || 0);
  const budgetUsage = budgetAmount > 0 ? (Number(budgetData?.currentExpenses || 0) / budgetAmount) * 100 : null;

  const scorecards = [
    {
      label: "Savings Discipline",
      value: clamp(Math.round(((savingsRate + 20) / 40) * 100), 0, 100),
      description: savingsRate >= 20 ? "Strong monthly saving momentum." : "Improving this will raise your overall score fastest.",
    },
    {
      label: "Bill Reliability",
      value: clamp(Math.round(billDisciplineRate - overdueBills.length * 8), 0, 100),
      description: overdueBills.length === 0 ? "No overdue bills right now." : `${overdueBills.length} bill reminders need attention.`,
    },
    {
      label: "Emergency Buffer",
      value: clamp(Math.round((expenseCoverageMonths / 6) * 100), 0, 100),
      description: expenseCoverageMonths >= 3 ? "Your cash buffer is building well." : "Aim for at least 3 months of expense coverage.",
    },
    {
      label: "Budget Control",
      value: budgetUsage === null ? 60 : clamp(Math.round(100 - Math.max(0, budgetUsage - 70) * 2), 0, 100),
      description: budgetUsage === null ? "Add a budget for a sharper score." : `${budgetUsage.toFixed(0)}% of budget used on the default account.`,
    },
  ];

  const overallScore = Math.round(
    scorecards.reduce((sum, item) => sum + item.value, 0) / scorecards.length
  );

  const statusTone =
    overallScore >= 80 ? "Excellent" : overallScore >= 65 ? "Stable" : overallScore >= 45 ? "Needs Attention" : "Risky";

  const recommendations = [
    savingsRate < 20 ? "Increase your savings rate with a stricter monthly transfer goal." : "Keep your current savings habit steady.",
    overdueBills.length > 0 ? "Clear overdue bills to immediately improve your reliability score." : "Your bill discipline looks healthy.",
    expenseCoverageMonths < 3 ? "Build a bigger emergency buffer using idle account balances." : "Your liquidity buffer is in a good zone.",
    budgetUsage !== null && budgetUsage > 90 ? "Your budget is nearly exhausted this month, so cut flexible spending." : "Budget usage is under control.",
  ];

  return (
    <div className="space-y-8 px-2 pt-6 md:px-0 animate-fade-in" style={{ animation: "fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-cyan-50 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-500/10" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-cyan-200/30 blur-2xl dark:bg-cyan-500/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">Financial Health</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              <span className="bg-gradient-to-r from-emerald-600 to-slate-900 bg-clip-text text-transparent">
                Health Score
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A simple health model based on savings, bills, liquidity, and budget behavior.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-white/85 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Overall Score</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-black tracking-tight">{overallScore}</p>
              <Badge variant="outline" className="mb-1">{statusTone}</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {scorecards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{card.label}</p>
              <HeartPulse className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <p className="section-title">Signals</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">What is driving the score</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                <p className="font-semibold">Savings Rate</p>
              </div>
              <p className="mt-3 text-2xl font-black">{savingsRate.toFixed(0)}%</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Income {formatCurrency(income)} vs expenses {formatCurrency(expenses)} this month.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <p className="font-semibold">Emergency Buffer</p>
              </div>
              <p className="mt-3 text-2xl font-black">{expenseCoverageMonths.toFixed(1)} months</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on account balances of {formatCurrency(totalBalance)}.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <BadgeIndianRupee className="h-4 w-4 text-amber-600" />
                <p className="font-semibold">Budget Control</p>
              </div>
              <p className="mt-3 text-2xl font-black">
                {budgetUsage === null ? "No budget" : `${budgetUsage.toFixed(0)}%`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {budgetUsage === null ? "Link a budget to tighten score accuracy." : "Usage is measured on your default account budget."}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <p className="font-semibold">Bill Reliability</p>
              </div>
              <p className="mt-3 text-2xl font-black">{overdueBills.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Overdue reminders are the quickest negative drag on the score.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <p className="section-title">Next Actions</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">How to improve it</h2>
          <div className="mt-5 space-y-3">
            {recommendations.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
