const RISK_LEVELS = ["conservative", "moderate", "aggressive"];
const DEFAULT_RISK = "moderate";
const DEFAULT_HORIZON_YEARS = 5;

const DEFAULT_UNIVERSE = {
  conservative: [
    { symbol: "UTI-NIFTY50", name: "UTI Nifty 50 Index Fund", bucket: "stocks" },
    { symbol: "BHARATBOND-2032", name: "Bharat Bond ETF (April 2032)", bucket: "bonds" },
    { symbol: "GOLDBEES", name: "Gold ETF (Gold Bees)", bucket: "alternatives" },
  ],
  moderate: [
    { symbol: "UTI-NIFTY50", name: "UTI Nifty 50 Index Fund", bucket: "stocks" },
    { symbol: "HDFC-DIVYIELD", name: "HDFC Dividend Yield Fund", bucket: "stocks" },
    { symbol: "BHARATBOND-2032", name: "Bharat Bond ETF (April 2032)", bucket: "bonds" },
  ],
  aggressive: [
    { symbol: "NIFTY50", name: "Nifty 50 Index Fund", bucket: "stocks" },
    { symbol: "NIFTYNEXT50", name: "Nifty Next 50 Index Fund", bucket: "stocks" },
    { symbol: "NIFTYMID150", name: "Nifty Midcap 150 Index Fund", bucket: "stocks" },
  ],
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeRisk = (risk) => {
  if (!risk) return DEFAULT_RISK;
  const normalized = String(risk).trim().toLowerCase();
  return RISK_LEVELS.includes(normalized) ? normalized : DEFAULT_RISK;
};

const parseSymbolsFromEnv = (envValue, fallback) => {
  if (!envValue) return fallback;
  return envValue
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [symbol, name, bucket] = entry.split("|").map((part) => part.trim());
      return {
        symbol: symbol || entry,
        name: name || symbol || entry,
        bucket: bucket || "stocks",
      };
    });
};

const getUniverseForRisk = (risk) => {
  if (risk === "conservative") {
    return parseSymbolsFromEnv(
      process.env.INVESTMENT_SYMBOLS_CONSERVATIVE,
      DEFAULT_UNIVERSE.conservative
    );
  }
  if (risk === "aggressive") {
    return parseSymbolsFromEnv(
      process.env.INVESTMENT_SYMBOLS_AGGRESSIVE,
      DEFAULT_UNIVERSE.aggressive
    );
  }
  return parseSymbolsFromEnv(
    process.env.INVESTMENT_SYMBOLS_MODERATE,
    DEFAULT_UNIVERSE.moderate
  );
};

const normalizeAllocation = (allocation) => {
  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  if (!total) return allocation;
  const factor = 100 / total;
  const normalized = {};
  Object.entries(allocation).forEach(([key, value]) => {
    normalized[key] = Math.round(value * factor);
  });
  const diff = 100 - Object.values(normalized).reduce((sum, value) => sum + value, 0);
  if (diff !== 0) {
    normalized.stocks = clamp((normalized.stocks || 0) + diff, 0, 100);
  }
  return normalized;
};

const computeAllocation = (risk, horizonYears) => {
  const base = {
    conservative: { stocks: 35, bonds: 50, cash: 10, alternatives: 5 },
    moderate: { stocks: 60, bonds: 30, cash: 5, alternatives: 5 },
    aggressive: { stocks: 80, bonds: 15, cash: 0, alternatives: 5 },
  }[risk];

  if (!base) return normalizeAllocation({ stocks: 60, bonds: 30, cash: 5, alternatives: 5 });

  const horizon = toNumber(horizonYears);
  const adjusted = { ...base };

  if (horizon !== null) {
    if (horizon < 3) {
      adjusted.stocks -= 15;
      adjusted.bonds += 10;
      adjusted.cash += 5;
    } else if (horizon < 5) {
      adjusted.stocks -= 5;
      adjusted.bonds += 5;
    } else if (horizon >= 7) {
      adjusted.stocks += 5;
      adjusted.bonds -= 5;
    }
  }

  adjusted.stocks = clamp(adjusted.stocks, 0, 95);
  adjusted.bonds = clamp(adjusted.bonds, 0, 90);
  adjusted.cash = clamp(adjusted.cash, 0, 20);
  adjusted.alternatives = clamp(adjusted.alternatives, 0, 15);

  return normalizeAllocation(adjusted);
};

const buildRationale = (item, profile, allocation) => {
  const notes = [];
  if (item.bucket === "bonds") notes.push("stability and income focus");
  if (item.bucket === "alternatives") notes.push("diversification beyond equities");
  if (item.bucket === "stocks") notes.push("long-term growth exposure");

  if (profile?.savingsRate !== null && profile?.savingsRate !== undefined) {
    if (profile.savingsRate < 0.1) notes.push("prioritize consistency over aggressive risk");
    if (profile.savingsRate >= 0.2) notes.push("room to take measured equity exposure");
  }

  if (allocation?.stocks >= 70 && item.bucket === "stocks") {
    notes.push("aligns with higher equity allocation");
  }

  if (allocation?.bonds >= 40 && item.bucket === "bonds") {
    notes.push("supports capital preservation");
  }

  return notes.length ? notes.join(", ") + "." : "Aligned with your target allocation.";
};

const buildWarnings = (profile) => {
  const warnings = [];
  if (profile?.emergencyFundMonths !== null && profile?.emergencyFundMonths !== undefined) {
    if (profile.emergencyFundMonths < 3) {
      warnings.push("Build a 3-6 month emergency fund before increasing risk exposure.");
    }
  }
  if (profile?.savingsRate !== null && profile?.savingsRate !== undefined) {
    if (profile.savingsRate < 0) warnings.push("Spending exceeds income; stabilize cash flow first.");
  }
  return warnings;
};

const computeAllocationWeights = (items, allocation) => {
  const grouped = items.reduce((acc, item) => {
    acc[item.bucket] = acc[item.bucket] || [];
    acc[item.bucket].push(item);
    return acc;
  }, {});

  const buckets = Object.keys(grouped);
  const totalIncluded = buckets.reduce((sum, bucket) => sum + (allocation?.[bucket] ?? 0), 0);

  const scaledBucketWeights = {};
  if (totalIncluded > 0) {
    const scaleFactor = 100 / totalIncluded;
    buckets.forEach((bucket) => {
      const raw = (allocation?.[bucket] ?? 0) * scaleFactor;
      scaledBucketWeights[bucket] = Math.floor(raw);
    });

    let remainder = 100 - Object.values(scaledBucketWeights).reduce((sum, value) => sum + value, 0);
    const sortedBuckets = [...buckets].sort((a, b) => (allocation?.[b] ?? 0) - (allocation?.[a] ?? 0));
    let index = 0;
    while (remainder > 0) {
      const bucket = sortedBuckets[index % sortedBuckets.length];
      scaledBucketWeights[bucket] += 1;
      remainder -= 1;
      index += 1;
    }
  }

  const output = [];
  Object.entries(grouped).forEach(([bucket, bucketItems]) => {
    const bucketWeight = totalIncluded > 0 ? (scaledBucketWeights[bucket] ?? 0) : allocation?.[bucket] ?? null;
    if (bucketWeight === null) {
      bucketItems.forEach((item) => output.push({ ...item, allocationPercent: null }));
      return;
    }

    const count = bucketItems.length || 1;
    const base = Math.floor(bucketWeight / count);
    let remainder = bucketWeight - base * count;

    bucketItems.forEach((item) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      output.push({
        ...item,
        allocationPercent: base + extra,
      });
    });
  });

  return output;
};

const attachQuotes = (recommendations, quotesBySymbol) => {
  return recommendations.map((item) => {
    const quote = quotesBySymbol?.get(item.symbol);
    return quote ? { ...item, quote } : item;
  });
};

const fetchYahooQuotes = async (symbols) => {
  if (!symbols?.length) return new Map();
  const uniqueSymbols = Array.from(new Set(symbols));

  const response = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(
      uniqueSymbols.join(",")
    )}`,
    {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    }
  );

  if (!response.ok) return new Map();
  const payload = await response.json();
  const results = Array.isArray(payload?.quoteResponse?.result)
    ? payload.quoteResponse.result
    : [];

  const map = new Map();
  results.forEach((quote) => {
    if (!quote?.symbol) return;
    map.set(quote.symbol, {
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      price: toNumber(quote.regularMarketPrice),
      change: toNumber(quote.regularMarketChange),
      changePercent: toNumber(quote.regularMarketChangePercent),
      currency: quote.currency || null,
      marketState: quote.marketState || null,
    });
  });

  return map;
};

const buildInvestmentRecommendations = async ({ profile, riskTolerance, horizonYears }) => {
  const risk = normalizeRisk(riskTolerance);
  const horizon = toNumber(horizonYears) ?? DEFAULT_HORIZON_YEARS;
  const allocation = computeAllocation(risk, horizon);
  const universe = getUniverseForRisk(risk);

  const withWeights = computeAllocationWeights(universe, allocation);
  const recommendations = withWeights.map((item) => ({
    ...item,
    rationale: buildRationale(item, profile, allocation),
  }));

  const warnings = buildWarnings(profile);
  const notes = [
    "Educational guidance only; confirm suitability with a licensed advisor.",
    "Consider taxes, fees, and local availability before investing.",
  ];

  const symbols = recommendations.map((item) => item.symbol);
  let quotes = new Map();
  try {
    quotes = await fetchYahooQuotes(symbols);
  } catch (error) {
    quotes = new Map();
  }

  return {
    risk,
    horizonYears: horizon,
    allocation,
    recommendations: attachQuotes(recommendations, quotes),
    warnings,
    notes,
    universeSource: process.env.INVESTMENT_SYMBOLS_CONSERVATIVE ||
      process.env.INVESTMENT_SYMBOLS_MODERATE ||
      process.env.INVESTMENT_SYMBOLS_AGGRESSIVE
      ? "env"
      : "defaults",
  };
};

export {
  RISK_LEVELS,
  DEFAULT_RISK,
  DEFAULT_HORIZON_YEARS,
  buildInvestmentRecommendations,
  normalizeRisk,
  toNumber,
};
