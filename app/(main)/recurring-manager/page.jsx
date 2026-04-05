import React from "react";
import { getRecurringTransactions } from "@/actions/transaction";
import RecurringManagerWorkspace from "./_components/recurring-manager-workspace";

export default async function RecurringManagerPage() {
  const transactions = await getRecurringTransactions();

  return (
    <div
      className="space-y-8 px-2 pt-6 md:px-0 animate-fade-in"
      style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}
    >
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-all duration-500 ease-out hover:shadow-xl">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-200/40 blur-2xl dark:bg-indigo-500/10" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-violet-200/30 blur-2xl dark:bg-violet-500/10" />
        <div className="relative flex flex-col gap-3">
          <p className="section-title">Recurring</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-indigo-600 to-slate-900 bg-clip-text text-transparent">
              Recurring Manager
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Review, pause, and tune recurring transactions from one focused control room.
          </p>
        </div>
      </section>

      <RecurringManagerWorkspace transactions={transactions} />
    </div>
  );
}
