"use client"

const indices = [
  { name: "NIFTY 50", value: "25,088.40", change: "+260.95", up: true },
  { name: "BANK NIFTY", value: "58,619.00", change: "+201.80", up: true },
  { name: "SENSEX", value: "81,666.46", change: "+943.52", up: true },
  // { name: "BSE", value: "26,286.90", change: "+271.84", up: true },
//   { name: "FINNIFTY", value: "26,799.00", change: "+99.90", up: true },
//   { name: "India Vix", value: "13.87", change: "-1.23", up: false },

]


export default function MarketTicker() {
  return (
    <div className="overflow-hidden rounded-lg bg-gray-100/70 dark:bg-gray-800/70 px-12 py-2">
      <div className="flex items-center gap-8 whitespace-nowrap animate-ticker text-base font-medium">
        {indices.map((i) => (
          <div
            key={i.name}
            className="flex items-center gap-3 min-w-max"
          >
            <span className="font-semibold tracking-wide">
              {i.name}
            </span>

            <span className="tabular-nums">
              {i.value}
            </span>

            <span
              className={`flex items-center gap-1 ${
                i.up ? "text-green-600" : "text-red-600"
              }`}
            >
              {i.up ? "▲" : "▼"} {i.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
