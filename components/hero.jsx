"use client";

import { Button } from "./ui/button";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRef } from 'react';

const HeroSection = () => {
  const imageRef = useRef();

  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const scrollThreshold = 100;

      if (scrollPosition > scrollThreshold) {
        imageElement.classList.add("hero-image-scrolled");
      } else {
        imageElement.classList.remove("hero-image-scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-8">
      <div className="pointer-events-none absolute inset-0 -z-10 aurora-bg dark:opacity-60" />
      <div className="pointer-events-none absolute inset-0 -z-10 grid-fade opacity-40 dark:opacity-20" />
      <div className="pointer-events-none absolute -left-20 top-10 -z-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl float-slow" />
      <div className="pointer-events-none absolute -right-16 top-24 -z-10 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl float-slow-delay" />

      <div className="container mx-auto flex flex-col items-center gap-12 text-center md:flex-row md:items-start md:text-left">
        <div className="flex-1 space-y-6">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm md:mx-0 dark:border-blue-500/40 dark:bg-slate-900/70 dark:text-blue-200">
            Live insights
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          </div>
          <h1 className="gradient-title dark:gradient-title-dark text-4xl leading-tight md:text-5xl lg:text-6xl xl:text-7xl fade-in-up">
            Money moves fast.
            <br className="hidden md:block" />
            <span className="block">So should your decisions.</span>
          </h1>
          <p className="text-base text-muted-foreground md:text-lg lg:text-xl max-w-xl mx-auto md:mx-0 fade-in-up-delay">
            FinanSmartz brings spending, budgeting, and investment insights into one
            real‑time command center so you can act with confidence.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                Launch dashboard
              </Button>
            </Link>
            <Link href="/watchdemo.mp4">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 border-blue-200 bg-white/80 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                Watch demo
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-left sm:max-w-md">
            <div className="rounded-2xl border border-blue-100 bg-white/70 p-4 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Weekly health
              </p>
              <p className="mt-2 text-2xl font-semibold">+12.4%</p>
              <p className="text-xs text-muted-foreground">Cashflow improvement</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm dark:border-indigo-500/30 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Smart alerts
              </p>
              <p className="mt-2 text-2xl font-semibold">8</p>
              <p className="text-xs text-muted-foreground">New opportunities</p>
            </div>
          </div>
        </div>

        <div className="mt-6 w-full max-w-xl md:mt-0 md:max-w-lg lg:max-w-xl">
          <div className="hero-image-wrapper">
            <div
              ref={imageRef}
              className="hero-image glass-card rounded-3xl border border-white/40 shadow-2xl"
            >
              <Image
                src="/banner.jpeg"
                width={1280}
                height={720}
                alt="FinanSmartz dashboard preview"
                className="h-full w-full rounded-3xl object-cover"
                priority
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-5 py-4 text-sm shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Realtime pulse</p>
              <p className="text-lg font-semibold">Market synced</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Updated</p>
              <p className="text-base font-semibold text-blue-600">Just now</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
