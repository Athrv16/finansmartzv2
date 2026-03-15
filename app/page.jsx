import React from "react";
import HeroSection from "@/components/hero";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";



export default function Home() {
  return (
    <div className="space-y-16 md:space-y-20 animate-fade-in" style={{ animation: 'fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)' }}>
      <HeroSection />

      <section>
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
            {statsData.map((item, index) => (
              <Card
                key={index}
                className="glass-card border-none bg-gradient-to-br from-slate-50/90 via-white/90 to-blue-50/80 p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-800/70"
              >
                <CardContent className="space-y-1 p-0">
                  <div className="text-2xl font-semibold text-slate-900 md:text-3xl dark:text-white">
                    {item.value}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground md:text-sm">
                    {item.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              A modern finance stack that feels effortless
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Automations, insights, and guardrails working together so you can focus on the next move.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuresData.map((feature, index) => (
              <Card
                key={index}
                className="h-full border-border/70 bg-white/80 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl dark:bg-slate-900/70 dark:hover:border-blue-500/40"
              >
                <CardContent className="space-y-4 pt-6">
                  <div className="inline-flex rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/60 bg-slate-50/80 py-12 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Your money, orchestrated in three steps
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Connect, analyze, and act with automated workflows designed for clarity.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
            {howItWorksData.map((step, index) => (
              <div key={index} className="rounded-2xl border border-white/60 bg-white/70 p-6 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10">
                  {step.icon}
                </div>
                <h3 className="mb-3 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

                      {/* <section className="py-20">
                        <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-16">
                        What our users say                 </h2>
                <div className="grid grid-cols-1 md: grid-cols-3 gap-8">
                  {testimonialsData.map((testimonial,index)=>(
                    <Card key={index} className="p-6">
                  <CardContent className="pt-4">
                    <div className="flex items-center mb-4">
                      <Image 
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                      />
                      <div className="ml-4">
                        <div className = "font-semibold">{testimonial.name}</div>
                        <div className = "test-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                    <p className = "text-gray-600">{testimonial.quote}</p>

                  </CardContent>
                </Card>
                  ))}
                </div>
              </div>
                      </section> */}

      <section className="relative overflow-hidden rounded-3xl py-16">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600" />
        <div className="absolute inset-0 -z-10 opacity-30 grid-fade" />
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-white md:text-3xl">
            Build confidence in every financial decision
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-sm text-white/80 md:text-base">
            Join thousands of users who are already managing their money smarter with FinanSmartz.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="rounded-full bg-white px-10 text-emerald-700 shadow-lg hover:bg-emerald-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Let&apos;s start
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
