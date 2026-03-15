import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  LineChart,
  Users,
  Globe,
  HeartHandshake,
} from "lucide-react";

const values = [
  {
    title: "Clarity Over Noise",
    description:
      "We turn complex financial data into simple, actionable signals that help you move confidently.",
    icon: Sparkles,
  },
  {
    title: "Security By Design",
    description:
      "Your data is encrypted in transit and at rest, with strict access controls and continuous monitoring.",
    icon: ShieldCheck,
  },
  {
    title: "Built For Momentum",
    description:
      "Automations, alerts, and dashboards that keep your money decisions fast and frictionless.",
    icon: LineChart,
  },
];

const milestones = [
  {
    year: "2023",
    label: "FinanSmartz is founded",
    detail: "A small team sets out to build a calmer, clearer way to manage money.",
  },
  {
    year: "2024",
    label: "Automation engine launched",
    detail: "Smart categorization, alerts, and recurring rules reduce manual work.",
  },
  {
    year: "2025",
    label: "Command center goes live",
    detail: "Unified dashboards, market pulse, and planning tools ship together.",
  },
];

const stats = [
  { label: "Accounts synced", value: "2,500+" },
  { label: "Monthly insights delivered", value: "45k+" },
  { label: "Avg. time saved per week", value: "3.1 hrs" },
  { label: "User satisfaction", value: "4.9/5" },
];

export default function AboutPage() {
  return (
    <div className="space-y-16 md:space-y-20 animate-fade-in" style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}>
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 px-6 py-12 dark:border-slate-800/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="section-title">About FinanSmartz</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            A smarter, calmer way to run your finances
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            FinanSmartz is a modern finance platform that brings budgets, cashflow,
            transactions, and market context into a single command center. Our goal is
            to make every financial decision feel informed, fast, and low‑stress.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button className="rounded-full bg-slate-900 px-8 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                Explore the dashboard
              </Button>
            </Link>
            <Link href="/transaction/create">
              <Button
                variant="outline"
                className="rounded-full border-blue-200 bg-white/80 px-8 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Add a transaction
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {values.map((value) => (
          <Card
            key={value.title}
            className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70"
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <value.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">{value.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {value.description}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Our mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                We believe financial tools should feel empowering, not overwhelming.
                FinanSmartz is built to reduce decision fatigue by highlighting what
                matters and automating the rest.
              </p>
              <p>
                From real‑time spending insights to proactive alerts, we help you
                stay ahead of surprises and in control of your next move.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 text-xs text-muted-foreground dark:bg-slate-900/50">
                  Average time to set up your first account: under 5 minutes.
                </div>
                <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 text-xs text-muted-foreground dark:bg-slate-900/50">
                  Weekly insights delivered automatically, no manual exports.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">By the numbers</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-slate-50/70 px-4 py-3 text-sm dark:bg-slate-900/50"
                >
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h2 className="text-2xl font-semibold tracking-tight">How we work</h2>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
          We combine financial expertise with thoughtful product design to build
          workflows that feel human. Every feature is tested with real users and
          measured by how much clarity it adds to their financial decisions.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Human support</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              We respond quickly and explain clearly, so you always know your next best step.
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <LineChart className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Real‑time insight</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Live dashboards, smart summaries, and cashflow forecasts you can trust.
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Globe className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-semibold">Global readiness</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Built to handle multi‑account, multi‑currency, and cross‑border workflows.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <h2 className="text-2xl font-semibold tracking-tight">Our journey</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {milestones.map((milestone) => (
            <Card
              key={milestone.year}
              className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{milestone.year}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {milestone.label}
                </p>
                <p>{milestone.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl">
        <Card className="border-border/60 bg-white/85 shadow-sm dark:bg-slate-900/70">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Privacy and security</CardTitle>
              <p className="text-sm text-muted-foreground">
                Designed to protect your data at every step.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
              Encryption at rest and in transit protects sensitive information.
            </div>
            <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
              Granular permissions limit data exposure and reduce risk.
            </div>
            <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
              Transparent data practices with clear, user‑friendly controls.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-white/80 to-emerald-50/80 px-6 py-10 text-center shadow-sm dark:border-slate-700/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Ready to build your financial command center?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Join FinanSmartz and get a clean, real‑time view of everything that matters.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button className="rounded-full bg-slate-900 px-8 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                Get started
              </Button>
            </Link>
            <Link href="/transaction/create">
              <Button
                variant="outline"
                className="rounded-full border-blue-200 bg-white/80 px-8 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                See it in action
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
