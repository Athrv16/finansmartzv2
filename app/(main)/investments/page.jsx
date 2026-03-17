import React from 'react';
import InvestmentRecommendations from '../dashboard/_components/investment-recommendations';

export default function InvestmentsPage() {
  return (
    <div
      className="space-y-8 px-2 pt-6 md:px-0 animate-fade-in"
      style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}
    >
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-slate-50 via-white to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-all duration-500 ease-out hover:shadow-xl">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/40 blur-2xl dark:bg-emerald-500/10" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-blue-200/30 blur-2xl dark:bg-blue-500/10" />
        <div className="relative flex flex-col gap-3">
          <p className="section-title">Investments</p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            <span className="bg-gradient-to-r from-emerald-600 to-slate-900 bg-clip-text text-transparent">
              Investment Recommendations
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Tune your risk and horizon to get a tailored allocation and instrument suggestions.
          </p>
        </div>
      </section>

      <InvestmentRecommendations />
    </div>
  );
}

