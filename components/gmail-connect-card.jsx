"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, Loader2, RefreshCw } from "lucide-react";

export default function GmailConnectCard() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // ⭐ Check Gmail connection status
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

  // ⭐ Connect Gmail
  const handleConnect = () => {
    window.location.href = "/api/gmail/connect";
  };

  // ⭐ Disconnect Gmail
  const handleDisconnect = async () => {
    await fetch("/api/gmail/disconnect", { method: "POST" });
    setConnected(false);
  };

  if (loading) {
    return (
      <div className="p-6 border rounded-xl flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-6 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center gap-4">
        <Mail className="text-blue-500" size={32} />

        <div className="flex-1">
          <h3 className="font-semibold text-lg">
            Auto Track UPI Transactions
          </h3>

          <p className="text-sm text-muted-foreground">
            Connect Gmail to automatically track your bank transactions.
          </p>
        </div>

        {connected ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect}>
            Connect Gmail
          </Button>
        )}
      </div>
    </div>
  );
}
