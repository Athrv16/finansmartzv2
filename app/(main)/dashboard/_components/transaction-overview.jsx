"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategoryName, normalizeCategoryId } from "@/data/categories";
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
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [comparisonView, setComparisonView] = useState("breakdown");
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

  const currentMonthTransactions = useMemo(() => {
    const currentDate = new Date();
    return accountTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentDate.getMonth() &&
        transactionDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [accountTransactions]);

  const lastMonthTransactions = useMemo(() => {
    const currentDate = new Date();
    const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return accountTransactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === lastMonthDate.getMonth() &&
        transactionDate.getFullYear() === lastMonthDate.getFullYear()
      );
    });
  }, [accountTransactions]);

  const currentMonthExpenses = useMemo(
    () => currentMonthTransactions.filter((t) => t.type === "EXPENSE"),
    [currentMonthTransactions]
  );

  const lastMonthExpenses = useMemo(
    () => lastMonthTransactions.filter((t) => t.type === "EXPENSE"),
    [lastMonthTransactions]
  );

  const currentMonthIncome = useMemo(
    () => currentMonthTransactions.filter((t) => t.type === "INCOME"),
    [currentMonthTransactions]
  );

  const lastMonthIncome = useMemo(
    () => lastMonthTransactions.filter((t) => t.type === "INCOME"),
    [lastMonthTransactions]
  );

  const smartSummary = useMemo(() => {
    const currentByCategory = currentMonthExpenses.reduce((acc, transaction) => {
      const categoryId = normalizeCategoryId(transaction.category);
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {});

    const lastByCategory = lastMonthExpenses.reduce((acc, transaction) => {
      const categoryId = normalizeCategoryId(transaction.category);
      acc[categoryId] = (acc[categoryId] || 0) + transaction.amount;
      return acc;
    }, {});

    let topIncrease = null;
    Object.keys(currentByCategory).forEach((categoryId) => {
      const delta = (currentByCategory[categoryId] || 0) - (lastByCategory[categoryId] || 0);
      if (!topIncrease || delta > topIncrease.delta) {
        topIncrease = { categoryId, delta };
      }
    });

    const largestExpense = currentMonthExpenses.reduce(
      (largest, transaction) =>
        transaction.amount > largest.amount
          ? { description: transaction.description || "Untitled", amount: transaction.amount }
          : largest,
      { description: "No expenses", amount: 0 }
    );

    const currentNet =
      currentMonthIncome.reduce((sum, t) => sum + t.amount, 0) -
      currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastNet =
      lastMonthIncome.reduce((sum, t) => sum + t.amount, 0) -
      lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const netDelta = currentNet - lastNet;

    return {
      topIncrease,
      largestExpense,
      netDelta,
    };
  }, [currentMonthExpenses, lastMonthExpenses, currentMonthIncome, lastMonthIncome]);

  const availableCategories = useMemo(() => {
    const uniqueCategories = new Map();
    currentMonthExpenses.forEach((transaction) => {
      const categoryId = normalizeCategoryId(transaction.category);
      if (!uniqueCategories.has(categoryId)) {
        uniqueCategories.set(categoryId, getCategoryName(categoryId));
      }
    });

    return Array.from(uniqueCategories.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [currentMonthExpenses]);

  useEffect(() => {
    if (selectedCategoryId === "all") {
      return;
    }
    const hasCategory = availableCategories.some((category) => category.id === selectedCategoryId);
    if (!hasCategory) {
      setSelectedCategoryId("all");
    }
  }, [availableCategories, selectedCategoryId]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategoryId === "all") {
      return currentMonthExpenses;
    }
    return currentMonthExpenses.filter(
      (transaction) => normalizeCategoryId(transaction.category) === selectedCategoryId
    );
  }, [currentMonthExpenses, selectedCategoryId]);

  const pieChartData = useMemo(() => {
    const expensesByCategory = filteredExpenses.reduce((acc, transaction) => {
      const categoryId = normalizeCategoryId(transaction.category);
      if (!acc[categoryId]) {
        acc[categoryId] = 0;
      }
      acc[categoryId] += transaction.amount;
      return acc;
    }, {});

    return Object.entries(expensesByCategory).map(([categoryId, amount]) => ({
      name: getCategoryName(categoryId),
      value: amount,
    }));
  }, [filteredExpenses]);

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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
          <CardTitle className="text-base font-semibold">Monthly Expense Breakdown</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={comparisonView} onValueChange={setComparisonView}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakdown">Breakdown</SelectItem>
                <SelectItem value="compare">Compare</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-5 pt-4">
          {comparisonView === "compare" ? (
            <div className="mx-4 space-y-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>This month expenses</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ₹{currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0).toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last month expenses</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ₹{lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0).toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delta</span>
                {(() => {
                  const delta =
                    currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0) -
                    lastMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

                  return (
                <span
                  className={cn(
                    "font-semibold",
                    delta < 0 ? "text-red-600" : "text-emerald-600"
                  )}
                >
                  {delta >= 0 ? "+" : "-"}₹{Math.abs(delta).toFixed(0)}
                </span>
                  );
                })()}
              </div>
            </div>
          ) : pieChartData.length === 0 ? (
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
