"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#0ea5e9", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#8b5cf6", "#ef4444"];

const DashboardOverview = ({ accounts, transactions }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
  );
  const [liveTransactions, setLiveTransactions] = useState(transactions || []);

  useEffect(() => {
    setLiveTransactions(transactions || []);
  }, [transactions]);

  useEffect(() => {
    let intervalId;

    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/transactions/live");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (Array.isArray(data.transactions)) {
          setLiveTransactions(data.transactions);
        }
      } catch (err) {
        console.error("Failed to fetch live transactions", err);
      }
    };

    fetchLatest();
    intervalId = setInterval(fetchLatest, 10000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const accountTransactions = useMemo(
    () => liveTransactions.filter((t) => t.accountId === selectedAccountId),
    [liveTransactions, selectedAccountId]
  );

  const recentTransactions = useMemo(
    () => [...accountTransactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [accountTransactions]
  );

  const currentMonthExpenses = useMemo(() => {
    const currentDate = new Date();
    return accountTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === "EXPENSE" &&
        transactionDate.getMonth() === currentDate.getMonth() &&
        transactionDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [accountTransactions]);

  const pieChartData = useMemo(() => {
    const expensesByCategory = currentMonthExpenses.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {});

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      name: category,
      value: amount,
    }));
  }, [currentMonthExpenses]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
          <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No recent transactions for this account.
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-slate-50/60 px-3 py-2 transition-colors hover:bg-slate-50/90 dark:bg-slate-900/40"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{transaction.description || "Untitled Transaction"}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), "PP")}</p>
                  </div>

                  <div
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      transaction.type === "EXPENSE" ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                    )}
                  >
                    {transaction.type === "EXPENSE" ? (
                      <ArrowDownRight className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                    )}
                    ₹{transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base font-semibold">Monthly Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-5 pt-4">
          {pieChartData.length === 0 ? (
            <div className="mx-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No expenses this month.
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={82}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
