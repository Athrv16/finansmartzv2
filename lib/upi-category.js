const STOP_WORDS = new Set([
  "upi",
  "pay",
  "payment",
  "paid",
  "txn",
  "transfer",
  "bank",
  "india",
  "private",
  "pvt",
  "ltd",
  "limited",
  "services",
  "service",
  "merchant",
  "store",
  "online",
  "ref",
  "utr",
  "imps",
  "neft",
  "rtgs",
]);

function getNormalizedType(type = "DEBIT") {
  return type === "CREDIT" || type === "INCOME" ? "INCOME" : "EXPENSE";
}

export function normalizeMerchantText(value = "") {
  return value
    .toLowerCase()
    .replace(/[@._/-]/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeMerchant(value = "") {
  return normalizeMerchantText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function addVote(store, key, category) {
  if (!key || !category) return;

  if (!store.has(key)) {
    store.set(key, new Map());
  }

  const votes = store.get(key);
  votes.set(category, (votes.get(category) || 0) + 1);
}

function pickTopCategory(votes, minimumVotes = 1) {
  if (!votes) return null;

  let bestCategory = null;
  let bestScore = 0;

  for (const [category, score] of votes.entries()) {
    if (score > bestScore) {
      bestCategory = category;
      bestScore = score;
    }
  }

  return bestScore >= minimumVotes ? bestCategory : null;
}

export function createUserCategoryModel(transactions = []) {
  const model = {
    exact: {
      EXPENSE: new Map(),
      INCOME: new Map(),
    },
    token: {
      EXPENSE: new Map(),
      INCOME: new Map(),
    },
  };

  for (const tx of transactions) {
    const normalizedType = getNormalizedType(tx.type);
    const description = tx.description || tx.merchant || "";
    const normalized = normalizeMerchantText(description);

    if (!normalized || !tx.category) continue;

    addVote(model.exact[normalizedType], normalized, tx.category);

    for (const token of new Set(tokenizeMerchant(description))) {
      addVote(model.token[normalizedType], token, tx.category);
    }
  }

  return model;
}

export function selectCategoryTrainingExamples(transactions = []) {
  const manuallyReviewed = transactions.filter((tx) => {
    if (!tx?.createdAt || !tx?.updatedAt) return false;

    return (
      new Date(tx.updatedAt).getTime() - new Date(tx.createdAt).getTime() >
      60 * 1000
    );
  });

  if (manuallyReviewed.length > 0) {
    return manuallyReviewed;
  }

  return transactions;
}

function inferFromUserModel(merchant = "", type = "DEBIT", model = null) {
  if (!model) return null;

  const normalizedType = getNormalizedType(type);
  const normalizedMerchant = normalizeMerchantText(merchant);

  if (!normalizedMerchant) return null;

  const exactMatch = pickTopCategory(
    model.exact[normalizedType].get(normalizedMerchant),
    1
  );

  if (exactMatch) return exactMatch;

  for (const [seenMerchant, votes] of model.exact[normalizedType].entries()) {
    if (
      seenMerchant.length >= 5 &&
      (normalizedMerchant.includes(seenMerchant) ||
        seenMerchant.includes(normalizedMerchant))
    ) {
      const nearMatch = pickTopCategory(votes, 1);
      if (nearMatch) return nearMatch;
    }
  }

  const aggregateVotes = new Map();

  for (const token of tokenizeMerchant(merchant)) {
    const tokenVotes = model.token[normalizedType].get(token);
    if (!tokenVotes) continue;

    for (const [category, score] of tokenVotes.entries()) {
      aggregateVotes.set(category, (aggregateVotes.get(category) || 0) + score);
    }
  }

  return pickTopCategory(aggregateVotes, 2);
}

function inferRuleBasedCategory(merchant = "", type = "DEBIT") {
  const m = merchant.toLowerCase();

  if (type === "CREDIT" || type === "INCOME") {
    if (m.includes("salary")) return "salary";
    if (m.includes("interest")) return "investments";
    if (m.includes("refund")) return "other-income";
    return "other-income";
  }

  if (
    m.includes("mcd") ||
    m.includes("zomato") ||
    m.includes("swiggy") ||
    m.includes("domino") ||
    m.includes("pizza") ||
    m.includes("burger") ||
    m.includes("restaurant") ||
    m.includes("food") ||
    m.includes("cafe") ||
    m.includes("zepto") ||
    m.includes("blinkit") ||
    m.includes("instamart")
  ) {
    return m.includes("zepto") || m.includes("blinkit") || m.includes("instamart")
      ? "groceries"
      : "food";
  }

  if (
    m.includes("netflix") ||
    m.includes("prime") ||
    m.includes("hotstar") ||
    m.includes("movie") ||
    m.includes("jiocinema") ||
    m.includes("cinema") ||
    m.includes("spotify") ||
    m.includes("youtube")
  ) {
    return "entertainment";
  }

  if (
    m.includes("amzn") ||
    m.includes("amazon") ||
    m.includes("flipkart") ||
    m.includes("myntra") ||
    m.includes("ajio") ||
    m.includes("meesho")
  ) {
    return "shopping";
  }

  if (
    m.includes("uber") ||
    m.includes("ola") ||
    m.includes("rapido") ||
    m.includes("fuel") ||
    m.includes("petrol") ||
    m.includes("diesel") ||
    m.includes("metro")
  ) {
    return "transportation";
  }

  if (
    m.includes("electric") ||
    m.includes("recharge") ||
    m.includes("broadband") ||
    m.includes("bill") ||
    m.includes("wifi") ||
    m.includes("internet") ||
    m.includes("mobile")
  ) {
    return "utilities";
  }

  if (
    m.includes("med") ||
    m.includes("hospital") ||
    m.includes("clinic") ||
    m.includes("pharma") ||
    m.includes("apollo")
  ) {
    return "healthcare";
  }

  if (
    m.includes("school") ||
    m.includes("college") ||
    m.includes("course") ||
    m.includes("tuition")
  ) {
    return "education";
  }

  return "other-expense";
}

export function inferUpiCategory(merchant = "", type = "DEBIT", model = null) {
  return (
    inferFromUserModel(merchant, type, model) ||
    inferRuleBasedCategory(merchant, type)
  );
}
