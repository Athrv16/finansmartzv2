"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { toggleRecurringTransaction } from "@/actions/transaction";
import { getCategoryName } from "@/data/categories";
import { format } from "date-fns";
import { toast } from "sonner";

const RecurringManagerList = ({
  transactions,
  emptyMessage = "No recurring transactions yet. Create one from the Add Transaction page.",
  showNextDue = true,
}) => {
  const {
    loading: toggleLoading,
    fn: toggleFn,
    data: toggleResult,
  } = useFetch(toggleRecurringTransaction);

  useEffect(() => {
    if (toggleResult?.success) {
      toast.success("Recurring rule updated");
    }
  }, [toggleResult]);

  const hasItems = transactions && transactions.length > 0;

  const nextDueLabel = useMemo(() => {
    if (!hasItems) return "No recurring transactions yet.";
    const next = transactions.find((t) => t.nextRecurringDate);
    if (!next) return "No upcoming recurring dates.";
    return `${next.description || "Recurring item"} on ${format(new Date(next.nextRecurringDate), "PP")}`;
  }, [hasItems, transactions]);

  return (
    <div className="space-y-3">
      {!hasItems && (
        <p className="text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}
      {hasItems && showNextDue && (
        <p className="text-xs text-muted-foreground">
          Next due: {nextDueLabel}
        </p>
      )}
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-900/70"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {transaction.description || "Recurring transaction"}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{transaction.account?.name || "Account"}</span>
              <span>•</span>
              <span>{getCategoryName(transaction.category)}</span>
              {!transaction.isRecurring && (
                <>
                  <span>•</span>
                  <span className="text-amber-600">Paused</span>
                </>
              )}
              {transaction.nextRecurringDate && (
                <>
                  <span>•</span>
                  <span>Next {format(new Date(transaction.nextRecurringDate), "PP")}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold">
              ₹{Number(transaction.amount).toFixed(0)}
            </div>
            <Switch
              checked={Boolean(transaction.isRecurring)}
              disabled={toggleLoading}
              onCheckedChange={(checked) => toggleFn(transaction.id, checked)}
            />
            <Button size="icon" variant="ghost" asChild>
              <Link href={`/transaction/create?edit=${transaction.id}`} aria-label="Edit recurring transaction">
                <Pencil className="h-4 w-4 text-blue-500" />
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecurringManagerList;
