import { google } from "googleapis";

function formatGmailAfterDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

export function isGmailAuthError(err) {
  return (
    err?.status === 400 &&
    (err?.message?.includes("invalid_grant") ||
      err?.response?.data?.error === "invalid_grant")
  );
}

/**
 * Fetch recent bank / UPI related emails
 * Supports incremental sync using lastSyncedAt
 */
export async function fetchBankEmails(oauthClient, lastSyncedAt = null) {
  const gmail = google.gmail({ version: "v1", auth: oauthClient });
  const request = {
    userId: "me",
    maxResults: 20,
    labelIds: ["INBOX"],
  };

  if (lastSyncedAt) {
    const afterDate = formatGmailAfterDate(lastSyncedAt);

    // Use Gmail's date-search format to avoid API query parsing errors.
    if (afterDate) {
      request.q = `after:${afterDate}`;
    }
  }

  try {
    const res = await gmail.users.messages.list(request);
    return res.data.messages || [];
  } catch (err) {
    if (err?.status === 400 && request.q && !isGmailAuthError(err)) {
      console.warn("[GMAIL] Invalid search query, retrying without q:", request.q);

      const fallbackRes = await gmail.users.messages.list({
        userId: "me",
        maxResults: request.maxResults,
        labelIds: request.labelIds,
      });

      return fallbackRes.data.messages || [];
    }

    throw err;
  }
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
