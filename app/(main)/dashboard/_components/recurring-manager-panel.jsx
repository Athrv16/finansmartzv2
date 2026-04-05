import { Card, CardContent } from "@/components/ui/card";
import RecurringManagerList from "./recurring-manager-list";

const RecurringManagerPanel = ({ transactions }) => {
  const count = transactions?.length || 0;

  return (
    <Card className="border-border/60 bg-white/90 shadow-sm dark:bg-slate-900/70">
      <CardContent className="space-y-5 p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Recurring
            </p>
            <h3 className="text-2xl font-semibold">Recurring Manager</h3>
            <p className="text-sm text-muted-foreground">
              Pause or edit recurring transactions. Keep future charges under control.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
              {count} {count === 1 ? "rule" : "rules"}
            </span>
          </div>
        </div>
        <RecurringManagerList transactions={transactions} />
      </CardContent>
    </Card>
  );
};

export default RecurringManagerPanel;
