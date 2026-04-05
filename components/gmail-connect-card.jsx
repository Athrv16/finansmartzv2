"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export default function GmailConnectCard() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const syncTriggeredRef = useRef(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/gmail/status");
        const data = await res.json();
        setConnected(data.connected);
      } catch (err) {
        console.error("Gmail status error", err);
      } finally {
        setLoading(false);
      }
    }

    checkStatus();
  }, []);

  useEffect(() => {
    if (loading || !connected || syncTriggeredRef.current) return;
    syncTriggeredRef.current = true;

    setSyncing(true);
    setSyncError("");
    runSyncNow()
      .catch((err) => {
        console.error("Gmail sync-now error", err);
        setSyncError(err.message || "Gmail sync failed.");
      })
      .finally(() => {
        setSyncing(false);
      });
  }, [connected, loading]);

  async function runSyncNow() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/gmail/sync-now", {
        method: "POST",
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.code === "GMAIL_RECONNECT_REQUIRED"
            ? "Gmail access expired. Please reconnect Gmail."
            : data.message || "Gmail sync failed."
        );
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        throw new Error("Sync is taking longer than expected. Please try again.");
      }

      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  const handleSyncNow = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      setSyncError("");
      await runSyncNow();
    } catch (err) {
      console.error("Gmail sync-now error", err);
      setSyncError(err.message || "Gmail sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/gmail/connect";
  };

  const handleDisconnect = async () => {
    await fetch("/api/gmail/disconnect", { method: "POST" });
    setConnected(false);
    setSyncError("");
  };

  return (
    <Card className="border border-dashed border-blue-200/70 bg-white/80 shadow-sm dark:border-blue-500/30 dark:bg-slate-900/70">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
          </span>
          <div>
            <CardTitle className="text-base font-semibold">
              Auto-track UPI transactions
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Connect Gmail to automatically import and categorize statements.
            </p>
          </div>
        </div>
        {connected && !loading && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <CheckCircle className="h-3 w-3" />
            Connected
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-0">
        <div className="text-xs text-muted-foreground">
          {connected
            ? "Gmail is connected. Your latest UPI transactions will appear automatically."
            : "Secure OAuth connection. We only read transaction-related emails."}
        </div>
        {syncError && (
          <div className="w-full text-xs font-medium text-rose-600">
            {syncError}
          </div>
        )}
        {connected ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNow}
              disabled={loading || syncing}
            >
              {syncing ? "Syncing..." : "Sync now"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={loading || syncing}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={handleConnect} disabled={loading}>
            Connect Gmail
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
