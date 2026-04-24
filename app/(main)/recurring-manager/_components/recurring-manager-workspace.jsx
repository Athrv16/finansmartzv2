"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Clock3, Filter, PauseCircle, Repeat, Search, ShieldCheck } from "lucide-react";
import { getCategoryName } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RecurringManagerList from "../../dashboard/_components/recurring-manager-list";
import { cn } from "@/lib/utils";

const RecurringManagerWorkspace = ({ transactions }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const now = useMemo(() => new Date(), []);
  const nextSevenDays = useMemo(() => {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    return next;
  }, [now]);

  const stats = useMemo(() => {
    const active = transactions.filter((transaction) => transaction.isRecurring).length;
    const paused = transactions.filter((transaction) => !transaction.isRecurring).length;
    const upcoming = transactions.filter((transaction) => {
      if (!transaction.nextRecurringDate || !transaction.isRecurring) return false;
      const next = new Date(transaction.nextRecurringDate);
      return next >= now && next <= nextSevenDays;
    }).length;
    const monthlyLoad = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return { active, paused, upcoming, monthlyLoad };
  }, [transactions, now, nextSevenDays]);

  const filteredTransactions = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const description = (transaction.description || "").toLowerCase();
      const category = getCategoryName(transaction.category).toLowerCase();
      const account = (transaction.account?.name || "").toLowerCase();
      const matchesSearch =
        !lowerSearch ||
        description.includes(lowerSearch) ||
        category.includes(lowerSearch) ||
        account.includes(lowerSearch);

      const nextDate = transaction.nextRecurringDate ? new Date(transaction.nextRecurringDate) : null;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && transaction.isRecurring) ||
        (statusFilter === "paused" && !transaction.isRecurring) ||
        (statusFilter === "upcoming" &&
          transaction.isRecurring &&
          nextDate &&
          nextDate >= now &&
          nextDate <= nextSevenDays);

      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter, now, nextSevenDays]);

  const grouped = useMemo(() => {
    return {
      active: transactions.filter((transaction) => transaction.isRecurring),
      paused: transactions.filter((transaction) => !transaction.isRecurring),
      upcoming: transactions.filter((transaction) => {
        if (!transaction.nextRecurringDate || !transaction.isRecurring) return false;
        const next = new Date(transaction.nextRecurringDate);
        return next >= now && next <= nextSevenDays;
      }),
    };
  }, [transactions, now, nextSevenDays]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recurring Load</p>
            <Repeat className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">₹{stats.monthlyLoad.toFixed(0)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Total amount currently managed here.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active Rules</p>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.active}</p>
          <p className="mt-1 text-sm text-muted-foreground">Recurring flows still switched on.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Paused Rules</p>
            <PauseCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.paused}</p>
          <p className="mt-1 text-sm text-muted-foreground">Saved for later but not firing now.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Next 7 Days</p>
            <Clock3 className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight">{stats.upcoming}</p>
          <p className="mt-1 text-sm text-muted-foreground">Rules scheduled to trigger soon.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="mb-5">
            <p className="section-title">Control Room</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Manage cadence without friction
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pause rules when life changes, then switch them back on without losing their setup.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Keep history intact</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Paused rules remain in view so nothing disappears from your workflow.
              </p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Jump into edits</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Fine-tune amount, category, or interval directly from the linked transaction editor.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Stay ahead</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Track what is active now and what is due to trigger in the next few days.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-start">
            <Button asChild>
              <Link href="/transaction/create">Create New Recurring Transaction</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="mb-5">
            <p className="section-title">Health Check</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Quick status by rule state
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A compact view of what is active, what is paused, and what needs a closer look soon.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: "active", label: "Active now", tone: "emerald" },
              { key: "paused", label: "Paused", tone: "amber" },
              { key: "upcoming", label: "Upcoming in 7 days", tone: "blue" },
            ].map(({ key, label, tone }) => (
              <div
                key={key}
                className={cn(
                  "rounded-2xl border p-4",
                  tone === "emerald" && "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20",
                  tone === "amber" && "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20",
                  tone === "blue" && "border-blue-200 bg-blue-50/80 dark:border-blue-900/60 dark:bg-blue-950/20"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {grouped[key].length} items
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {grouped[key].length > 0
                    ? grouped[key]
                        .slice(0, 2)
                        .map((transaction) => transaction.description || getCategoryName(transaction.category))
                        .join(" • ")
                    : "Nothing in this bucket right now."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-title">Manager</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Search and filter recurring rules
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Focus on active, paused, or soon-to-trigger rules without losing the full picture.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search recurring rules..."
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
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            {(search || statusFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <RecurringManagerList
          transactions={filteredTransactions}
          emptyMessage="No recurring rules match the current filters."
          showNextDue={false}
        />
      </section>
    </div>
  );
};

export default RecurringManagerWorkspace;
