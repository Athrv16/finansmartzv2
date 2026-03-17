'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ShieldCheck, TrendingUp } from 'lucide-react';

const riskOptions = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

const formatCurrency = (value, currency) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  } catch (err) {
    return `${currency || 'INR'} ${Number(value).toFixed(0)}`;
  }
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(0)}%`;
};

export default function InvestmentRecommendations() {
  const [risk, setRisk] = useState('moderate');
  const [horizonYears, setHorizonYears] = useState(5);
  const [data, setData] = useState(null);
  const [incomeInput, setIncomeInput] = useState('');
  const [expenseInput, setExpenseInput] = useState('');
  const [incomeWarning, setIncomeWarning] = useState('');
  const [incomeError, setIncomeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('risk', risk);
    params.set('horizonYears', String(horizonYears || 5));
    return params.toString();
  }, [risk, horizonYears]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/investment-recommendations?${queryString}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load recommendations');
        }
        const payload = await res.json();
        if (active) {
          setData(payload);
          if (payload?.profile) {
            setIncomeInput(
              payload.profile.monthlyIncome !== null && payload.profile.monthlyIncome !== undefined
                ? String(Math.round(payload.profile.monthlyIncome))
                : ''
            );
            setExpenseInput(
              payload.profile.monthlyExpenses !== null && payload.profile.monthlyExpenses !== undefined
                ? String(Math.round(payload.profile.monthlyExpenses))
                : ''
            );
          }
        }
      } catch (err) {
        if (active) {
          setError(err.message || String(err));
          setData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [queryString]);

  const profile = data?.profile;
  const recommendations = data?.recommendations;
  const allocation = recommendations?.allocation;
  const recs = recommendations?.recommendations || [];

  const parsedIncome = incomeInput !== '' ? Number(incomeInput) : profile?.monthlyIncome ?? null;
  const parsedExpenses = expenseInput !== '' ? Number(expenseInput) : profile?.monthlyExpenses ?? null;
  const savingsRate = parsedIncome && parsedIncome > 0 && parsedExpenses !== null
    ? ((parsedIncome - parsedExpenses) / parsedIncome) * 100
    : null;
  const savingsRateNegative = savingsRate !== null && savingsRate < 0;
  const emergencyFundMonths = profile?.emergencyFundMonths ?? null;
  const shouldGate = emergencyFundMonths !== null && emergencyFundMonths < 3;

  const handleApplyProfile = async () => {
    setIncomeWarning('');
    setIncomeError('');

    if (parsedIncome !== null && parsedIncome < 1000) {
      setIncomeWarning('Income seems unusually low. Please verify your entry.');
      setIncomeError('Monthly Income must be at least ₹1,000.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/investment-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskTolerance: risk,
          horizonYears,
          profile: {
            monthlyIncome: parsedIncome,
            monthlyExpenses: parsedExpenses,
            currency: 'INR',
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save profile');
      }
      const payload = await res.json();
      setData(payload);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-white/90 shadow-sm dark:bg-slate-900/70">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Investments</p>
            <h3 className="text-xl font-semibold">Investment Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Personalized guidance based on your profile and risk tolerance.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
              <label className="block text-[11px] uppercase text-muted-foreground">Risk</label>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none"
              >
                {riskOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
              <label className="block text-[11px] uppercase text-muted-foreground">Horizon</label>
              <input
                type="number"
                min={1}
                max={30}
                value={horizonYears}
                onChange={(e) => setHorizonYears(Number(e.target.value || 1))}
                className="w-20 bg-transparent text-sm font-medium outline-none"
              />
              <span className="ml-1 text-xs text-muted-foreground">yrs</span>
            </div>
            <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
              <label className="block text-[11px] uppercase text-muted-foreground">Monthly Income</label>
              <input
                type="number"
                min={0}
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="w-32 bg-transparent text-sm font-medium outline-none"
              />
            </div>
            <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
              <label className="block text-[11px] uppercase text-muted-foreground">Monthly Expenses</label>
              <input
                type="number"
                min={0}
                value={expenseInput}
                onChange={(e) => setExpenseInput(e.target.value)}
                className="w-32 bg-transparent text-sm font-medium outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyProfile}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Apply
            </button>
          </div>
        </div>

        {incomeWarning && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {incomeWarning}
          </div>
        )}

        {incomeError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {incomeError}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-border/60 bg-slate-50/80 p-4 text-sm text-muted-foreground dark:bg-slate-900/60">
            Loading recommendations...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && recommendations && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
                <p className="text-xs text-muted-foreground">Monthly Income</p>
                <p className="text-base font-semibold">{formatCurrency(parsedIncome, 'INR')}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
                <p className="text-xs text-muted-foreground">Monthly Expenses</p>
                <p className="text-base font-semibold">{formatCurrency(parsedExpenses, 'INR')}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p
                  className={`text-base font-semibold ${savingsRateNegative ? 'text-red-600' : ''}`}
                  title={savingsRateNegative ? 'Savings rate is negative. Expenses exceed income.' : undefined}
                >
                  {savingsRate !== null ? `${savingsRate.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
                <p className="text-xs text-muted-foreground">Emergency Fund</p>
                <p className="text-base font-semibold">
                  {profile?.emergencyFundMonths !== null && profile?.emergencyFundMonths !== undefined
                    ? `${profile.emergencyFundMonths.toFixed(1)} months`
                    : '—'}
                </p>
              </div>
            </div>

            {shouldGate && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                ⚠️ Build your emergency fund first before investing.
              </div>
            )}

            {!shouldGate && (
              <>
                <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-blue-50 via-white to-slate-50 p-5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Target Allocation
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
                      Stocks: <span className="font-semibold">{allocation?.stocks ?? 0}%</span>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
                      Bonds: <span className="font-semibold">{allocation?.bonds ?? 0}%</span>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
                      Cash: <span className="font-semibold">{allocation?.cash ?? 0}%</span>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-white/80 px-3 py-2 text-sm dark:bg-slate-900/70">
                      Alternatives: <span className="font-semibold">{allocation?.alternatives ?? 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    Suggested Instruments
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {recs.map((item) => (
                      <div
                        key={item.symbol}
                        className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-900/70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.symbol}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <p>Bucket: {item.bucket}</p>
                      <p>Allocation (investable): {item.allocationPercent ?? '—'}%</p>
                          {item.quote?.price !== null && item.quote?.price !== undefined && (
                            <p>
                              Price: {item.quote?.currency || 'INR'} {item.quote.price}
                            </p>
                          )}
                          {item.quote?.changePercent !== null && item.quote?.changePercent !== undefined && (
                            <p>
                              Change: {item.quote.changePercent.toFixed(2)}%
                            </p>
                          )}
                        </div>
                        <p className="mt-3 text-xs">{item.rationale}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {recommendations?.warnings?.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                {recommendations.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            {recommendations?.notes?.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-slate-50/80 p-4 text-xs text-muted-foreground dark:bg-slate-900/60">
                {recommendations.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}
