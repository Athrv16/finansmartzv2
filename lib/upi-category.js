export function inferUpiCategory(merchant = "", type = "DEBIT") {
  const m = merchant.toLowerCase();

  // INCOME
  if (type === "CREDIT") {
    if (m.includes("salary")) return "salary";
    if (m.includes("interest")) return "investments";
    return "other-income";
  }

  // FOOD
  if (
    m.includes("mcd") ||
    m.includes("zomato") ||
    m.includes("swiggy") ||
    m.includes("domino") ||
    m.includes("pizza") ||
    m.includes("burger") ||
    m.includes("restaurant") ||
    m.includes("food") ||
    m.includes("zepto")
  ) {
    return "food";
  }

  // ENTERTAINMENT
  if (
    m.includes("netflix") ||
    m.includes("prime") ||
    m.includes("hotstar") ||
    m.includes("movie") ||
    m.includes("jiocinema") ||
    m.includes("cinema")
  ) {
    return "entertainment";
  }

  // SHOPPING
  if (
    m.includes("amzn") ||
    m.includes("amazon") ||
    m.includes("flipkart") ||
    m.includes("myntra") ||
    m.includes("ajio")
  ) {
    return "shopping";
  }

  // TRANSPORT
  if (
    m.includes("uber") ||
    m.includes("ola") ||
    m.includes("rapido") ||
    m.includes("fuel") ||
    m.includes("petrol")
  ) {
    return "transportation";
  }

  // BILLS / UTILITIES
  if (
    m.includes("electric") ||
    m.includes("recharge") ||
    m.includes("broadband") ||
    m.includes("bill")
  ) {
    return "utilities";
  }

  // DEFAULT
  return "other-expense";
}
