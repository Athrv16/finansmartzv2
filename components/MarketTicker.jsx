"use client"

import { useEffect, useState } from "react"

const fallbackIndices = [
  { name: "NIFTY 50", symbol: "^NSEI", value: 25088.4, change: 260.95, up: true },
  { name: "BANK NIFTY", symbol: "^NSEBANK", value: 58619, change: 201.8, up: true },
  { name: "SENSEX", symbol: "^BSESN", value: 81666.46, change: 943.52, up: true },
]

const formatNumber = (value) => {
  if (value === null || value === undefined) return "--"
  const number = Number(value)
  if (!Number.isFinite(number)) return "--"
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(number)
}

const formatChange = (value) => {
  if (value === null || value === undefined) return "--"
  const number = Number(value)
  if (!Number.isFinite(number)) return "--"
  const sign = number > 0 ? "+" : ""
  return `${sign}${formatNumber(number)}`
}

export default function MarketTicker() {
  const [indices, setIndices] = useState(fallbackIndices)

  useEffect(() => {
    let isMounted = true

    const loadTicker = async () => {
      try {
        const response = await fetch("/api/market-ticker", { cache: "no-store" })
        if (!response.ok) return
        const payload = await response.json()
        if (isMounted && Array.isArray(payload?.data) && payload.data.length > 0) {
          setIndices(payload.data)
        }
      } catch (error) {
        // Keep fallback data if the API is unavailable.
      }
    }

    loadTicker()
    const interval = setInterval(loadTicker, 15000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-full border border-slate-200/60 bg-white/70 px-4 py-1.5 text-slate-700 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100 sm:px-6">
      <div className="flex items-center gap-8 whitespace-nowrap animate-ticker text-sm font-medium sm:text-base hover:[animation-play-state:paused]">
        {indices.map((i) => (
          <div key={i.name} className="flex items-center gap-3 min-w-max">
            <span className="font-semibold tracking-wide">{i.name}</span>

            <span className="tabular-nums">{formatNumber(i.value)}</span>

            <span
              className={`flex items-center gap-1 ${
                i.up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {i.up ? "▲" : "▼"} {formatChange(i.change)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
