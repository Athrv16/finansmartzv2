"use client";

import { seedFromCsvForUser } from "@/actions/seed";
import useFetch from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function LoadDemoDataCard() {
  const router = useRouter();
  const { data, loading, error, fn } = useFetch(seedFromCsvForUser);

  useEffect(() => {
    if (!data || loading) return;

    if (data.success && !data.skipped) {
      toast.success("Demo data loaded");
      router.refresh();
      return;
    }

    if (data.skipped) {
      toast.info(data.message || "Demo data is already available");
    }
  }, [data, loading, router]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to load demo data");
    }
  }, [error]);

  return (
    <Card className="border-dashed border-slate-300/70 bg-gradient-to-br from-slate-50 to-white dark:border-slate-700 dark:from-slate-900 dark:to-slate-950">
      <CardContent className="flex h-full flex-col items-start gap-4 p-6">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <Database className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Load Demo Data</h3>
          <p className="text-sm text-muted-foreground">
            Start with sample accounts and transactions instead of an empty dashboard.
          </p>
        </div>
        <Button onClick={() => fn()} disabled={loading} className="mt-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load demo data"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
