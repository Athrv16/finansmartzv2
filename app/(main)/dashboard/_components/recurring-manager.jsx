import { getRecurringTransactions } from "@/actions/transaction";
import RecurringManagerPanel from "./recurring-manager-panel";

export default async function RecurringManager() {
  const transactions = await getRecurringTransactions();

  return <RecurringManagerPanel transactions={transactions} />;
}
