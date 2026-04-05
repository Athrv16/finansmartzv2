const DEFAULT_INDICES = [
  { name: "NIFTY 50", symbol: "^NSEI", value: 25088.4, change: 260.95, up: true },
  { name: "BANK NIFTY", symbol: "^NSEBANK", value: 58619, change: 201.8, up: true },
  { name: "SENSEX", symbol: "^BSESN", value: 81666.46, change: 943.52, up: true },
  { name: "Reliance", symbol: "RELIANCE.NS", value: 2948.7, change: 31.2, up: true },
  { name: "TCS", symbol: "TCS.NS", value: 4126.45, change: 24.85, up: true },
  { name: "Infosys", symbol: "INFY.NS", value: 1538.3, change: -12.4, up: false },
  { name: "HDFC Bank", symbol: "HDFCBANK.NS", value: 1682.9, change: 14.55, up: true },
  { name: "ICICI Bank", symbol: "ICICIBANK.NS", value: 1189.4, change: 9.8, up: true },
]

const toNumber = (value) => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeQuote = (quote, fallback) => {
  const last = toNumber(quote?.regularMarketPrice ?? quote?.close ?? quote?.price ?? quote?.last ?? quote?.value)
  const change = toNumber(quote?.regularMarketChange ?? quote?.change ?? quote?.delta ?? quote?.change_abs)
  const percent = toNumber(quote?.regularMarketChangePercent ?? quote?.percent_change ?? quote?.change_percent ?? quote?.change_pct)
  const resolvedChange = change ?? (percent && last ? (percent / 100) * last : null)
  const up = resolvedChange === null ? fallback.up : resolvedChange >= 0

  return {
    name: quote?.shortName || quote?.longName || quote?.name || fallback.name,
    symbol: quote?.symbol || fallback.symbol,
    value: last ?? fallback.value,
    change: resolvedChange ?? fallback.change,
    percent: percent ?? null,
    up,
  }
}

const getSymbols = () => {
  const raw = process.env.MARKET_TICKER_SYMBOLS
  if (!raw) return DEFAULT_INDICES.map((item) => item.symbol)
  return raw
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean)
}

const getFallbackMap = () => {
  const map = new Map()
  DEFAULT_INDICES.forEach((item) => {
    map.set(item.symbol, item)
  })
  return map
}

export const dynamic = "force-dynamic"

export async function GET() {
  const symbols = getSymbols()
  const fallbackMap = getFallbackMap()

  const fallback = symbols.map((symbol) => (
    fallbackMap.get(symbol) || {
      name: symbol,
      symbol,
      value: null,
      change: null,
      up: true,
    }
  ))

  const yahooHeaders = {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json",
  }

  const fetchQuote = async () => {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
        symbols.join(",")
      )}`,
      { cache: "no-store", headers: yahooHeaders }
    )
    if (!response.ok) return []
    const payload = await response.json()
    return Array.isArray(payload?.quoteResponse?.result)
      ? payload.quoteResponse.result
      : []
  }

  const fetchChart = async (symbol) => {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`,
      { cache: "no-store", headers: yahooHeaders }
    )
    if (!response.ok) return null
    const payload = await response.json()
    const result = Array.isArray(payload?.chart?.result) ? payload.chart.result[0] : null
    const meta = result?.meta
    if (!meta) return null
    return {
      symbol,
      shortName: meta?.shortName || meta?.longName,
      regularMarketPrice: meta?.regularMarketPrice,
      regularMarketChange: meta?.regularMarketPrice && meta?.previousClose
        ? meta.regularMarketPrice - meta.previousClose
        : null,
      regularMarketChangePercent: meta?.regularMarketPrice && meta?.previousClose
        ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
        : null,
    }
  }

  try {
    const quoteResults = await fetchQuote()
    let normalized = symbols.map((symbol, index) => {
      const quote = quoteResults.find((item) => item?.symbol === symbol)
      return normalizeQuote(quote, fallback[index])
    })

    const hasLive = normalized.some((item, index) => item.value !== fallback[index]?.value)

    if (!hasLive) {
      const chartResults = await Promise.all(symbols.map(fetchChart))
      normalized = symbols.map((symbol, index) => {
        const chartQuote = chartResults[index]
        return normalizeQuote(chartQuote, fallback[index])
      })
    }

    const isStatic = normalized.every((item, index) => item.value === fallback[index]?.value)

    return Response.json(
      {
        data: normalized,
        source: isStatic ? "static" : "yahoo_finance",
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    return Response.json(
      { data: fallback, source: "static", updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    )
  }
}
