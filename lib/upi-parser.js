import crypto from "crypto";

export function parseBankEmail(text) {
  if (!text) return null;

  // Normalize text
  const clean = text.replace(/\s+/g, " ").toLowerCase();

  // Amount (Rs / INR / ₹)
  const amountMatch =
    clean.match(/rs\.?\s?([\d,]+\.?\d*)/) ||
    clean.match(/₹\s?([\d,]+\.?\d*)/) ||
    clean.match(/inr\s?([\d,]+\.?\d*)/);

  if (!amountMatch) return null;

  const amount = Number(amountMatch[1].replace(/,/g, ""));

  // Debit / Credit
  let type = null;
  if (clean.includes("debited")) type = "DEBIT";
  if (clean.includes("credited")) type = "CREDIT";

  if (!type) return null;

  // Merchant / Receiver
  let merchant = "Unknown";

  const merchantMatch =
    clean.match(/to\s+([a-z0-9 &._/-]+)/) ||
    clean.match(/towards\s+([a-z0-9 &._/-]+)/) ||
    clean.match(/from\s+([a-z0-9 &._/-]+)/);

  if (merchantMatch) {
    merchant = merchantMatch[1].trim();
  }

  // Reference ID (UPI / UTR / Ref / Txn)
  const refMatch =
    clean.match(/upi ref(?:erence)?[:\s]+([\w\d]+)/) ||
    clean.match(/utr[:\s]+([\w\d]+)/) ||
    clean.match(/txn(?: id)?[:\s]+([\w\d]+)/) ||
    clean.match(/ref(?: no)?[:\s]+([\w\d]+)/);

  const reference = refMatch ? refMatch[1] : null;

  // Hash for deduplication
  const rawHash = crypto
    .createHash("sha256")
    .update(amount + type + merchant + (reference || ""))
    .digest("hex");

  return {
    amount,
    type,
    merchant,
    reference,
    rawHash,
  };
}
