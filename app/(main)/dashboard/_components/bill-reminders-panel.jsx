"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createBill } from "@/actions/bills";
import BillRemindersList from "./bill-reminders-list";

const BillRemindersPanel = ({ bills }) => {
  const [isOpen, setIsOpen] = useState(false);
  const billCount = bills?.length || 0;

  const nextBillLabel = useMemo(() => {
    if (!bills || bills.length === 0) return "No upcoming bills";
    const nextBill = bills[0];
    const dueDate = new Date(nextBill.nextDueDate).toLocaleDateString("en-IN");
    return `${nextBill.name} • Due ${dueDate}`;
  }, [bills]);

  return (
    <Card className="border-border/60 bg-white/90 shadow-sm dark:bg-slate-900/70">
      <CardContent className="space-y-5 p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/60 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Reminders
            </p>
            <h3 className="text-2xl font-semibold">Bill Reminders</h3>
            <p className="text-sm text-muted-foreground">
              Track upcoming bills and subscriptions. We will email you before they are due.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              {billCount} {billCount === 1 ? "bill" : "bills"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen((current) => !current)}
            >
              {isOpen ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>

        {!isOpen && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-white/70 px-4 py-3 text-sm text-muted-foreground dark:bg-slate-900/50">
            <span>{nextBillLabel}</span>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
              Add or Manage
            </Button>
          </div>
        )}

        {isOpen && (
          <>
            <form
              action={createBill}
              className="grid gap-4 rounded-2xl border border-border/60 bg-slate-50/70 p-5 dark:bg-slate-900/60 md:grid-cols-2 lg:grid-cols-6"
            >
              <div className="lg:col-span-2">
                <label className="text-xs uppercase text-muted-foreground">Bill Name</label>
                <input
                  name="name"
                  placeholder="Netflix / Rent / EMI"
                  className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
                  required
                />
              </div>
              <div className="lg:col-span-1">
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
              <div className="lg:col-span-1">
                <label className="text-xs uppercase text-muted-foreground">Due Date</label>
                <input
                  name="dueDate"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-border/60 bg-white/90 px-3 py-2 text-sm outline-none dark:bg-slate-900/70"
                  required
                />
              </div>
              <div className="lg:col-span-1">
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
              <div className="flex items-center gap-2 lg:col-span-1">
                <input
                  type="checkbox"
                  name="isRecurring"
                  className="h-4 w-4 rounded border-border/60"
                />
                <span className="text-sm text-muted-foreground">Recurring</span>
              </div>
              <div className="lg:col-span-6">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Bill
                </button>
              </div>
            </form>

            <BillRemindersList bills={bills} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BillRemindersPanel;
