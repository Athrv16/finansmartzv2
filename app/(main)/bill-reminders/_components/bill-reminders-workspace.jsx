"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CreditCard,
  Filter,
  PlusCircle,
  Search,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { createBill } from "@/actions/bills";
import BillRemindersList from "../../dashboard/_components/bill-reminders-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const isSameDay = (left, right) =>
  left.getDate() === right.getDate() &&
  left.getMonth() === right.getMonth() &&
  left.getFullYear() === right.getFullYear();

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

const getMonthCalendar = (date, bills) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < offset; i += 1) cells.push(null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const current = new Date(year, month, day);
    const dayBills = bills.filter((bill) => {
      const due = new Date(bill.nextDueDate);
      return isSameDay(due, current);
    });
    cells.push({ date: current, bills: dayBills });
  }

  return cells;
};

const filterBillByStatus = (bill, filter, now, oneWeekLater) => {
  const dueDate = new Date(bill.nextDueDate);
  const status = bill.resolvedStatus || bill.status;

  if (filter === "all") return true;
  if (filter === "overdue") return status === "OVERDUE";
  if (filter === "today") return isSameDay(dueDate, now);
  if (filter === "week") return dueDate >= now && dueDate <= oneWeekLater;
  if (filter === "recurring") return bill.isRecurring;
  if (filter === "autopay") return bill.isAutoPay;
  if (filter === "subscriptions") return (bill.category || "").toLowerCase() === "subscription";
  if (filter === "paid") return status === "PAID";

  return true;
};

const BillRemindersWorkspace = ({ bills, monthlyBudget = null }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const now = useMemo(() => new Date(), []);
  const oneWeekLater = useMemo(() => {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    return next;
  }, [now]);

  const stats = useMemo(() => {
    const overdue = bills.filter((bill) => (bill.resolvedStatus || bill.status) === "OVERDUE").length;
    const dueSoon = bills.filter((bill) => {
      const due = new Date(bill.nextDueDate);
      return due >= now && due <= oneWeekLater;
    }).length;
    const recurring = bills.filter((bill) => bill.isRecurring).length;
    const subscriptions = bills.filter((bill) => (bill.category || "").toLowerCase() === "subscription").length;
    const monthlyLoad = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const essentialLoad = bills
      .filter((bill) => bill.priority === "ESSENTIAL")
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const sharedBills = bills.filter((bill) => Array.isArray(bill.sharedWith) && bill.sharedWith.length > 0).length;
    const variablePredictions = bills.filter((bill) => bill.isVariableAmount && bill.estimatedAmount).length;

    return {
      overdue,
      dueSoon,
      recurring,
      subscriptions,
      monthlyLoad,
      essentialLoad,
      sharedBills,
      variablePredictions,
    };
  }, [bills, now, oneWeekLater]);

  const groupedBills = useMemo(() => ({
    overdue: bills.filter((bill) => (bill.resolvedStatus || bill.status) === "OVERDUE"),
    today: bills.filter((bill) => isSameDay(new Date(bill.nextDueDate), now)),
    week: bills.filter((bill) => {
      const due = new Date(bill.nextDueDate);
      return due > now && due <= oneWeekLater;
    }),
    later: bills.filter((bill) => new Date(bill.nextDueDate) > oneWeekLater),
  }), [bills, now, oneWeekLater]);

  const filteredBills = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return bills.filter((bill) => {
      const dueDate = new Date(bill.nextDueDate);
      const matchesSearch =
        !lowerSearch ||
        bill.name.toLowerCase().includes(lowerSearch) ||
        (bill.category || "").toLowerCase().includes(lowerSearch) ||
        (bill.notes || "").toLowerCase().includes(lowerSearch) ||
        dueDate.toLocaleDateString("en-IN").toLowerCase().includes(lowerSearch);

      return matchesSearch && filterBillByStatus(bill, statusFilter, now, oneWeekLater);
    });
  }, [bills, now, oneWeekLater, search, statusFilter]);

  const topCategories = useMemo(() => {
    const buckets = new Map();
    for (const bill of bills) {
      const key = bill.category || "uncategorized";
      buckets.set(key, (buckets.get(key) || 0) + Number(bill.amount || 0));
    }
    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [bills]);

  const monthlyCalendar = useMemo(() => getMonthCalendar(now, bills), [bills, now]);
  const budgetDelta = monthlyBudget == null ? null : monthlyBudget - stats.monthlyLoad;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Monthly Load</p>
            <Waves className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{formatCurrency(stats.monthlyLoad)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Budget impact snapshot for all active reminders.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Due In 7 Days</p>
            <CalendarClock className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.dueSoon}</p>
          <p className="mt-1 text-sm text-muted-foreground">Staged notifications can run at 7, 3, 1, and 0 days.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Overdue</p>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.overdue}</p>
          <p className="mt-1 text-sm text-muted-foreground">Overdue bills stay visible until paid or skipped.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Subscriptions</p>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.subscriptions}</p>
          <p className="mt-1 text-sm text-muted-foreground">Track recurring services separately from essentials.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="mb-5">
            <p className="section-title">Quick Add</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Add a smarter bill reminder
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Recurring rules, auto-pay, prediction, notes, split info, and reminder cadence all live in one form.
            </p>
          </div>

          <form
            action={createBill}
            className="grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800/70 dark:bg-slate-900/60 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label className="text-xs uppercase text-muted-foreground">Bill Name</label>
              <input
                name="name"
                placeholder="Electricity / Water / Netflix / Rent"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Amount</label>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Predicted Amount</label>
              <input
                name="estimatedAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Only for variable bills"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
              />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Due Date</label>
              <input
                name="dueDate"
                type="date"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Frequency</label>
              <select
                name="recurringInterval"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
                defaultValue=""
              >
                <option value="">One-time</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Category</label>
              <select
                name="category"
                defaultValue="utilities"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
              >
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="emi">EMI</option>
                <option value="insurance">Insurance</option>
                <option value="credit-card">Credit Card</option>
                <option value="subscription">Subscription</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Priority</label>
              <select
                name="priority"
                defaultValue="ESSENTIAL"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
              >
                <option value="ESSENTIAL">Essential</option>
                <option value="FLEXIBLE">Flexible</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-muted-foreground">Reminder Days</label>
              <input
                name="reminderDays"
                defaultValue="7,3,1,0"
                placeholder="7,3,1,0"
                className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase text-muted-foreground">Notes / Transaction ID / Proof Link</label>
              <textarea
                name="notes"
                placeholder="Add instructions, meter notes, or payment comments"
                className="mt-2 min-h-24 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
              />
            </div>
            <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm text-muted-foreground dark:bg-slate-900/70">
                <input type="checkbox" name="isRecurring" className="h-4 w-4 rounded border-border/60" />
                Recurring reminder
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm text-muted-foreground dark:bg-slate-900/70">
                <input type="checkbox" name="isAutoPay" className="h-4 w-4 rounded border-border/60" />
                Auto-pay enabled
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm text-muted-foreground dark:bg-slate-900/70">
                <input type="checkbox" name="isVariableAmount" className="h-4 w-4 rounded border-border/60" />
                Variable amount
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                <PlusCircle className="h-4 w-4" />
                Add Bill Reminder
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <div className="mb-5">
              <p className="section-title">Insights</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Bill health snapshot
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The page now covers recurring schedules, reminders, priorities, subscriptions, sharing, partial payments, and history.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Budget impact</p>
                  <Badge variant="outline">{monthlyBudget == null ? "No budget linked" : formatCurrency(monthlyBudget)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {budgetDelta == null
                    ? "Add a dashboard budget to unlock budget-overrun warnings here."
                    : budgetDelta >= 0
                      ? `${formatCurrency(stats.monthlyLoad)} in bill load leaves ${formatCurrency(budgetDelta)} under budget.`
                      : `${formatCurrency(stats.monthlyLoad)} in bill load is ${formatCurrency(Math.abs(budgetDelta))} above budget.`}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Essential load</p>
                  <Badge variant="outline">{formatCurrency(stats.essentialLoad)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stats.sharedBills} shared bills and {stats.variablePredictions} variable-bill forecasts are active.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Top categories</p>
                  <Sparkles className="h-4 w-4 text-blue-500" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {topCategories.length > 0 ? topCategories.map(([name, value]) => (
                    <Badge key={name} variant="outline" className="border-blue-200 bg-white/80 text-blue-700">
                      {name} {formatCurrency(value)}
                    </Badge>
                  )) : (
                    <p className="text-sm text-muted-foreground">No category insights yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <div className="mb-5">
              <p className="section-title">Reminder Radar</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                See what needs attention
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { key: "overdue", label: "Overdue", tone: "rose" },
                { key: "today", label: "Due today", tone: "amber" },
                { key: "week", label: "Next 7 days", tone: "blue" },
                { key: "later", label: "Later", tone: "emerald" },
              ].map(({ key, label, tone }) => (
                <div
                  key={key}
                  className={cn(
                    "rounded-2xl border p-4",
                    tone === "rose" && "border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20",
                    tone === "amber" && "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20",
                    tone === "blue" && "border-blue-200 bg-blue-50/80 dark:border-blue-900/60 dark:bg-blue-950/20",
                    tone === "emerald" && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {groupedBills[key].length} items
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {groupedBills[key].length > 0
                      ? groupedBills[key].slice(0, 2).map((bill) => bill.name).join(" • ")
                      : "Nothing here right now."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-title">Calendar</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Monthly bill map
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A compact calendar view helps spot heavy cash-outflow dates and shared due clusters.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </Badge>
        </div>

        <div className="grid grid-cols-7 gap-2 text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-2 py-1 font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
          {monthlyCalendar.map((cell, index) => (
            <div
              key={cell ? cell.date.toISOString() : `empty-${index}`}
              className="min-h-24 rounded-2xl border border-border/60 bg-slate-50/70 p-2 dark:bg-slate-900/50"
            >
              {cell ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{cell.date.getDate()}</span>
                    {cell.bills.length > 0 && (
                      <Badge variant="outline" className="h-5 rounded-full px-2 py-0 text-[10px]">
                        {cell.bills.length}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {cell.bills.slice(0, 2).map((bill) => (
                      <div key={bill.id} className="truncate rounded-full bg-white/90 px-2 py-1 text-[10px] dark:bg-slate-950/70">
                        {bill.name}
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-title">Manage</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Search, filter, and update bills
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the list below for status tracking, partial payments, proof, sharing, and payment history.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search bills..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-sm dark:border-slate-800/70 dark:bg-slate-900/60">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="all">All</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="week">This week</option>
                <option value="recurring">Recurring</option>
                <option value="autopay">Auto-pay</option>
                <option value="subscriptions">Subscriptions</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <Button variant="outline" className="rounded-xl">
              <BellRing className="mr-2 h-4 w-4" />
              {stats.recurring} recurring live
            </Button>
            <Button variant="outline" className="rounded-xl">
              <Users className="mr-2 h-4 w-4" />
              {stats.sharedBills} shared
            </Button>
          </div>
        </div>

        <BillRemindersList
          bills={filteredBills}
          emptyMessage="No bills match this view yet. Try a different filter or add a new reminder above."
        />
      </section>
    </div>
  );
};

export default BillRemindersWorkspace;
