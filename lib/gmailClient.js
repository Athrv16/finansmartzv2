import { google } from "googleapis";

/**
 * Fetch recent bank / UPI related emails
 * Supports incremental sync using lastSyncedAt
 */
export async function fetchBankEmails(oauthClient, lastSyncedAt = null) {

  const gmail = google.gmail({ version: "v1", auth: oauthClient });

  // Base search query
  let query = "debited OR credited OR UPI OR UTR OR IMPS OR NEFT OR RTGS";

  // ⭐ Incremental sync support
  if (lastSyncedAt) {

    const timestamp = Math.floor(
      new Date(lastSyncedAt).getTime() / 1000
    );

    query = `after:${timestamp} (${query})`;
  }

  const res = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 20,
  });

  return res.data.messages || [];
}

/**
 * Recursively extract email body (plain text or HTML)
 */
export function extractEmailBody(payload) {

  if (!payload) return "";

  // Plain text
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  // HTML fallback
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = Buffer.from(payload.body.data, "base64").toString("utf-8");

    // Remove HTML tags
    return html.replace(/<[^>]*>/g, " ");
  }

  // Multipart recursion
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractEmailBody(part);
      if (text) return text;
    }
  }

  return "";
}
