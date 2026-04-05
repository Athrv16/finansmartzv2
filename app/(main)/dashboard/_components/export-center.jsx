"use client";

import React, { useState } from "react";
import { Download, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { toast } from "sonner";

const downloadFile = async (url, filename) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

const ExportCenter = () => {
  const [loading, setLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [sentLink, setSentLink] = useState("");

  const handleExport = async (format) => {
    setLoading(true);
    try {
      if (format === "csv") {
        await downloadFile("/api/export/transactions?format=csv", "transactions-export.csv");
      }
      toast.success("Export ready");
    } catch (error) {
      toast.error(error.message || "Failed to export");
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    setEmailOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailValue.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to send email");
      }
      toast.success("Export email sent");
      setSentLink(data?.link || "");
      setEmailOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-white/90 shadow-sm dark:bg-slate-900/70">
      <CardContent className="space-y-4 p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-gradient-to-r from-emerald-50 via-white to-slate-50 p-5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Export Center
            </p>
            <h3 className="text-2xl font-semibold">Export & Share</h3>
            <p className="text-sm text-muted-foreground">
              Download your transactions or email a copy instantly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={loading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button type="button" variant="ghost" onClick={handleEmail}>
              <Mail className="mr-2 h-4 w-4" />
              Email Me
            </Button>
          </div>
        </div>
      </CardContent>
      <Drawer open={emailOpen} onOpenChange={setEmailOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Email Export</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-3">
            <label className="text-sm font-medium">Send to</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={emailValue}
              onChange={(event) => setEmailValue(event.target.value)}
            />
            <Button type="button" className="w-full" onClick={handleSendEmail} disabled={loading}>
              {loading ? "Sending..." : "Send Email"}
            </Button>
            {sentLink && (
              <div className="rounded-xl border border-border/60 bg-slate-50/70 p-3 text-xs text-muted-foreground dark:bg-slate-900/60">
                <p>Email queued. If it doesn’t arrive, use this download link:</p>
                <button
                  type="button"
                  className="mt-2 text-blue-600 underline"
                  onClick={() => {
                    navigator.clipboard.writeText(sentLink);
                    toast.success("Download link copied");
                  }}
                >
                  Copy export link
                </button>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </Card>
  );
};

export default ExportCenter;
