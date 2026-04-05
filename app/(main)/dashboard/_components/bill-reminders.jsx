import { getBills } from "@/actions/bills";
import BillRemindersPanel from "./bill-reminders-panel";

export default async function BillReminders() {
  const bills = await getBills();

  return <BillRemindersPanel bills={bills} />;
}
