"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, Filter, PlusCircle, Search, Waves } from "lucide-react";
import { createBill } from "@/actions/bills";
import BillRemindersList from "../../dashboard/_components/bill-reminders-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const isSameDay = (left, right) =>
  left.getDate() === right.getDate() &&
  left.getMonth() === right.getMonth() &&
  left.getFullYear() === right.getFullYear();

const BillRemindersWorkspace = ({ bills }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const now = useMemo(() => new Date(), []);
  const oneWeekLater = useMemo(() => {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    return next;
  }, [now]);

  const stats = useMemo(() => {
    const overdue = bills.filter((bill) => new Date(bill.nextDueDate) < now).length;
    const dueSoon = bills.filter((bill) => {
      const due = new Date(bill.nextDueDate);
      return due >= now && due <= oneWeekLater;
    }).length;
    const recurring = bills.filter((bill) => bill.isRecurring).length;
    const monthlyLoad = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);

    return { overdue, dueSoon, recurring, monthlyLoad };
  }, [bills, now, oneWeekLater]);

  const filteredBills = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return bills.filter((bill) => {
      const dueDate = new Date(bill.nextDueDate);
      const matchesSearch =
        !lowerSearch ||
        bill.name.toLowerCase().includes(lowerSearch) ||
        dueDate.toLocaleDateString("en-IN").toLowerCase().includes(lowerSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "overdue" && dueDate < now) ||
        (statusFilter === "today" && isSameDay(dueDate, now)) ||
        (statusFilter === "week" && dueDate >= now && dueDate <= oneWeekLater) ||
        (statusFilter === "recurring" && bill.isRecurring) ||
        (statusFilter === "later" && dueDate > oneWeekLater);

      return matchesSearch && matchesStatus;
    });
  }, [bills, now, oneWeekLater, search, statusFilter]);

  const groupedBills = useMemo(() => {
    return {
      overdue: bills.filter((bill) => new Date(bill.nextDueDate) < now),
      today: bills.filter((bill) => isSameDay(new Date(bill.nextDueDate), now)),
      week: bills.filter((bill) => {
        const due = new Date(bill.nextDueDate);
        return due > now && due <= oneWeekLater;
      }),
      later: bills.filter((bill) => new Date(bill.nextDueDate) > oneWeekLater),
    };
  }, [bills, now, oneWeekLater]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Monthly Load</p>
            <Waves className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">₹{stats.monthlyLoad.toFixed(0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Total amount across all reminders.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Due In 7 Days</p>
            <CalendarClock className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.dueSoon}</p>
          <p className="mt-1 text-sm text-muted-foreground">Bills approaching soon.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Overdue</p>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.overdue}</p>
          <p className="mt-1 text-sm text-muted-foreground">Items already past due.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recurring</p>
            <BellRing className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.recurring}</p>
          <p className="mt-1 text-sm text-muted-foreground">Active repeating reminders.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="mb-5">
            <p className="section-title">Quick Add</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Add a bill in one pass
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Capture subscriptions, utilities, rent, or EMIs without digging through the dashboard.
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
            <label className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
              <input type="checkbox" name="isRecurring" className="h-4 w-4 rounded border-border/60" />
              Recurring reminder
            </label>
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

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="mb-5">
            <p className="section-title">Reminder Radar</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              See what needs attention
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A quick operational view of what is overdue, due today, and still comfortably ahead.
            </p>
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
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-title">Manage</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Search and filter reminders
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the filters to focus on overdue, recurring, or upcoming bills.
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
                <option value="week">Next 7 days</option>
                <option value="later">Later</option>
                <option value="recurring">Recurring</option>
              </select>
            </div>
            {(search || statusFilter !== "all") && (
              <Button variant="ghost" onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}>
                Clear
              </Button>
            )}
          </div>
        </div>

        <BillRemindersList
          bills={filteredBills}
          emptyMessage="No reminders match the current filters."
        />
      </section>
    </div>
  );
};

export default BillRemindersWorkspace;
