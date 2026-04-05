import React from "react";
import { AlertTriangle, BellRing, CalendarClock, Clock3, ShieldAlert, Sparkles } from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { getBills } from "@/actions/bills";
import { getCurrentBudget } from "@/actions/budget";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

const getPriorityTone = (priority) => {
  if (priority === "high") return "border-rose-200 bg-rose-50 text-rose-700";
  if (priority === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

export default async function NotificationsPage() {
  const [transactions, bills, accounts] = await Promise.all([
    getDashboardData(),
    getBills(),
    getUserAccounts(),
  ]);

  const defaultAccount = accounts.find((account) => account.isDefault);
  const budgetData = defaultAccount ? await getCurrentBudget(defaultAccount.id) : null;
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(weekLater.getDate() + 7);

  const notifications = [];

  for (const bill of bills) {
    const dueDate = new Date(bill.nextDueDate);
    const status = bill.resolvedStatus || bill.status;
    if (status === "OVERDUE") {
      notifications.push({
        title: `${bill.name} is overdue`,
        detail: `Pay or skip the bill reminder. Amount: ${formatCurrency(bill.amount)}.`,
        priority: "high",
        tag: "Bill reminder",
      });
    } else if (dueDate >= now && dueDate <= weekLater) {
      notifications.push({
        title: `${bill.name} is due soon`,
        detail: `Due on ${dueDate.toLocaleDateString("en-IN")} with reminder cadence ${Array.isArray(bill.reminderDays) ? bill.reminderDays.join(", ") : "7, 3, 1, 0"} days.`,
        priority: dueDate.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 2 ? "high" : "medium",
        tag: bill.isAutoPay ? "Auto-pay" : "Upcoming bill",
      });
    }
  }

  const recurringTransactions = transactions.filter((tx) => tx.isRecurring && tx.nextRecurringDate);
  for (const tx of recurringTransactions) {
    const nextDate = new Date(tx.nextRecurringDate);
    if (nextDate >= now && nextDate <= weekLater) {
      notifications.push({
        title: tx.description || "Recurring transaction due soon",
        detail: `Scheduled for ${nextDate.toLocaleDateString("en-IN")} at ${formatCurrency(tx.amount)}.`,
        priority: "medium",
        tag: "Recurring transaction",
      });
    }
  }

  const budgetAmount = Number(budgetData?.budget?.amount || 0);
  const currentExpenses = Number(budgetData?.currentExpenses || 0);
  const budgetUsage = budgetAmount > 0 ? (currentExpenses / budgetAmount) * 100 : null;
  if (budgetUsage !== null && budgetUsage >= 80) {
    notifications.push({
      title: "Budget usage is high",
      detail: `You have used ${budgetUsage.toFixed(0)}% of your default account budget.`,
      priority: budgetUsage >= 100 ? "high" : "medium",
      tag: "Budget alert",
    });
  }

  if (defaultAccount) {
    const monthlyBillLoad = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    if (Number(defaultAccount.balance || 0) < monthlyBillLoad) {
      notifications.push({
        title: "Default account balance looks tight",
        detail: `Balance ${formatCurrency(defaultAccount.balance)} is below your tracked bill load ${formatCurrency(monthlyBillLoad)}.`,
        priority: "medium",
        tag: "Cash flow",
      });
    }
  }

  notifications.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });

  const grouped = {
    high: notifications.filter((item) => item.priority === "high"),
    medium: notifications.filter((item) => item.priority === "medium"),
    low: notifications.filter((item) => item.priority === "low"),
  };

  return (
    <div className="space-y-8 px-2 pt-6 md:px-0 animate-fade-in" style={{ animation: "fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-amber-50 via-white to-rose-50 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-200/40 blur-2xl dark:bg-amber-500/10" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-rose-200/30 blur-2xl dark:bg-rose-500/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">Notifications</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              <span className="bg-gradient-to-r from-amber-600 to-slate-900 bg-clip-text text-transparent">
                Notifications Center
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              One feed for bill reminders, recurring activity, budget pressure, and cash-flow warnings.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-white/85 p-5 shadow-sm dark:border-amber-500/20 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Open Alerts</p>
            <p className="mt-3 text-5xl font-black tracking-tight">{notifications.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">High Priority</p>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{grouped.high.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Requires attention first.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Due This Week</p>
            <CalendarClock className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">
            {notifications.filter((item) => item.tag === "Upcoming bill" || item.tag === "Auto-pay").length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Bill-driven reminders in the next 7 days.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recurring</p>
            <Clock3 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{grouped.medium.filter((item) => item.tag === "Recurring transaction").length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Upcoming scheduled transactions.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Smart Warnings</p>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">
            {notifications.filter((item) => item.tag === "Budget alert" || item.tag === "Cash flow").length}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Budget and balance-based signals.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <div>
          <p className="section-title">Feed</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Recent alerts and warnings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This page consolidates the different reminders already running across your app.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              Everything looks calm right now. No active alerts were generated from your current data.
            </div>
          ) : notifications.map((item) => (
            <div key={`${item.title}-${item.tag}`} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge variant="outline" className={getPriorityTone(item.priority)}>
                    {item.priority}
                  </Badge>
                  <Badge variant="outline">{item.tag}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <BellRing className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
