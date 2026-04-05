"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategoryName, normalizeCategoryId } from "@/data/categories";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DATE_RANGES = {
  "7D": { label: "Last 7 days", days: 7 },
  "1M": { label: "Last month", days: 30 },
  "3M": { label: "Last 3 months", days: 90 },
  "6M": { label: "Last 6 months", days: 180 },
  ALL: { label: "All time", days: null },
};

const AccountChart = ({ transactions }) => {
  const [dateRange, setDateRange] = useState("1M");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const dateFilteredTransactions = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days ? startOfDay(subDays(now, range.days)) : startOfDay(new Date(0));

    return transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );
  }, [transactions, dateRange]);

  const availableCategories = useMemo(() => {
    const categories = new Map();
    dateFilteredTransactions.forEach((transaction) => {
      const categoryId = normalizeCategoryId(transaction.category);
      if (!categories.has(categoryId)) {
        categories.set(categoryId, getCategoryName(categoryId));
      }
    });

    return Array.from(categories.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dateFilteredTransactions]);

  useEffect(() => {
    if (categoryFilter === "all") {
      return;
    }
    const hasCategory = availableCategories.some((category) => category.id === categoryFilter);
    if (!hasCategory) {
      setCategoryFilter("all");
    }
  }, [availableCategories, categoryFilter]);

  const categoryFilteredTransactions = useMemo(() => {
    if (categoryFilter === "all") {
      return dateFilteredTransactions;
    }
    return dateFilteredTransactions.filter(
      (transaction) => normalizeCategoryId(transaction.category) === categoryFilter
    );
  }, [dateFilteredTransactions, categoryFilter]);

  const filteredData = useMemo(() => {
    const grouped = categoryFilteredTransactions.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");

      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }

      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [categoryFilteredTransactions]);

  const totals = useMemo(
    () =>
      filteredData.reduce(
        (acc, day) => ({
          income: acc.income + day.income,
          expense: acc.expense + day.expense,
        }),
        { income: 0, expense: 0 }
      ),
    [filteredData]
  );

  return (
    <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/60 pb-4">
        <CardTitle className="text-base font-semibold">Transaction Overview</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-emerald-600">₹{totals.income.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
            <p className="text-xs text-muted-foreground">Total Expense</p>
            <p className="text-lg font-bold text-red-600">₹{totals.expense.toFixed(2)}</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-3 text-center dark:bg-slate-900/40">
            <p className="text-xs text-muted-foreground">Net</p>
            <p className={`text-lg font-bold ${totals.income - totals.expense >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              ₹{(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip formatter={(value) => [`₹${value}`, undefined]} />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountChart;
