"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvestmentRecommendations from "../../dashboard/_components/investment-recommendations";

export default function InvestmentRecommendationsToggle() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-title">Recommendations</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Investment strategy suggestions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the panel to generate strategy ideas based on your risk, time horizon, income, and expenses.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Sparkles className="h-4 w-4" />
          {open ? "Hide Recommendations" : "Open Recommendations"}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {open ? (
        <div className="mt-6">
          <InvestmentRecommendations />
        </div>
      ) : null}
    </section>
  );
}
