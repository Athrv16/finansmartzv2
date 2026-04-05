"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Pencil,
  Receipt,
  SkipForward,
  Trash,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { deleteBill, recordBillPayment, skipBill, updateBill } from "@/actions/bills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const normalizeDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

const getStatusClasses = (status) => {
  if (status === "PAID") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "OVERDUE") return "border-rose-200 bg-rose-50 text-rose-700";
  if (status === "SKIPPED") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const createEditState = (bill) => ({
  id: bill.id,
  name: bill.name || "",
  amount: bill.amount ?? "",
  estimatedAmount: bill.estimatedAmount ?? "",
  dueDate: normalizeDate(bill.dueDate || bill.nextDueDate),
  isRecurring: Boolean(bill.isRecurring),
  recurringInterval: bill.recurringInterval || "one-time",
  category: bill.category || "other",
  priority: bill.priority || "ESSENTIAL",
  isAutoPay: Boolean(bill.isAutoPay),
  isVariableAmount: Boolean(bill.isVariableAmount),
  reminderDays: Array.isArray(bill.reminderDays) ? bill.reminderDays.join(",") : "7,3,1,0",
  notes: bill.notes || "",
  paymentProof: bill.paymentProof || "",
  sharedWith: Array.isArray(bill.sharedWith) ? bill.sharedWith.join(", ") : "",
  splitConfig: bill.splitConfig ? JSON.stringify(bill.splitConfig) : "",
});

const BillRemindersList = ({ bills, emptyMessage = "No bills yet. Add one above to start reminders." }) => {
  const router = useRouter();
  const [editBill, setEditBill] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null);

  const {
    loading: updateLoading,
    fn: updateFn,
    data: updateResult,
  } = useFetch(updateBill);

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleteResult,
  } = useFetch(deleteBill);

  const {
    loading: paymentLoading,
    fn: paymentFn,
    data: paymentResult,
  } = useFetch(recordBillPayment);

  const {
    loading: skipLoading,
    fn: skipFn,
    data: skipResult,
  } = useFetch(skipBill);

  useEffect(() => {
    if (updateResult?.id) {
      toast.success("Bill updated successfully");
      setEditBill(null);
      router.refresh();
    }
  }, [updateResult, router]);

  useEffect(() => {
    if (deleteResult?.success) {
      toast.success("Bill deleted successfully");
      router.refresh();
    }
  }, [deleteResult, router]);

  useEffect(() => {
    if (paymentResult?.id) {
      toast.success("Payment recorded");
      setPaymentBill(null);
      router.refresh();
    }
  }, [paymentResult, router]);

  useEffect(() => {
    if (skipResult?.id) {
      toast.success("Bill updated");
      router.refresh();
    }
  }, [skipResult, router]);

  const hasActiveMutation = useMemo(
    () => updateLoading || deleteLoading || paymentLoading || skipLoading,
    [updateLoading, deleteLoading, paymentLoading, skipLoading]
  );

  const handleDelete = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    await deleteFn(billId);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editBill) return;

    await updateFn(editBill.id, {
      name: editBill.name,
      amount: editBill.amount,
      estimatedAmount: editBill.estimatedAmount,
      dueDate: editBill.dueDate,
      isRecurring: editBill.isRecurring,
      recurringInterval: editBill.isRecurring ? editBill.recurringInterval || null : null,
      category: editBill.category,
      priority: editBill.priority,
      isAutoPay: editBill.isAutoPay,
      isVariableAmount: editBill.isVariableAmount,
      reminderDays: editBill.reminderDays,
      notes: editBill.notes,
      paymentProof: editBill.paymentProof,
      sharedWith: editBill.sharedWith,
      splitConfig: editBill.splitConfig,
    });
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();
    if (!paymentBill) return;

    await paymentFn(paymentBill.id, {
      amount: paymentBill.amount,
      note: paymentBill.note,
      paymentProof: paymentBill.paymentProof,
    });
  };

  return (
    <>
      <div className="space-y-3">
        {bills.length === 0 && (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}

        {bills.map((bill) => {
          const status = bill.resolvedStatus || bill.status;
          const paidProgress = Number(bill.amount || 0) > 0
            ? Math.min(100, (Number(bill.paidAmount || 0) / Number(bill.amount || 1)) * 100)
            : 0;
          const history = Array.isArray(bill.paymentHistory) ? bill.paymentHistory : [];

          return (
            <div
              key={bill.id}
              className="group relative rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-900/70"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{bill.name}</p>
                      <Badge variant="outline" className={getStatusClasses(status)}>
                        {status}
                      </Badge>
                      {bill.isRecurring && <Badge variant="outline">Recurring</Badge>}
                      {bill.isAutoPay && <Badge variant="outline">Auto-pay</Badge>}
                      {bill.category && <Badge variant="outline">{bill.category}</Badge>}
                      {bill.priority && <Badge variant="outline">{bill.priority === "ESSENTIAL" ? "Essential" : "Flexible"}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Due {new Date(bill.nextDueDate).toLocaleDateString("en-IN")}
                      {bill.recurringInterval ? ` • ${bill.recurringInterval.toLowerCase()}` : ""}
                      {Array.isArray(bill.reminderDays) && bill.reminderDays.length > 0
                        ? ` • reminders ${bill.reminderDays.join(", ")}d`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Amount {formatCurrency(bill.amount)}</span>
                    {bill.estimatedAmount ? <span>Predicted {formatCurrency(bill.estimatedAmount)}</span> : null}
                    {bill.lastPaidAmount ? <span>Last paid {formatCurrency(bill.lastPaidAmount)}</span> : null}
                    {bill.missedPaymentCount ? <span>Missed {bill.missedPaymentCount}</span> : null}
                  </div>

                  {(bill.notes || bill.paymentProof || (bill.sharedWith && bill.sharedWith.length > 0)) && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {bill.notes ? <p>{bill.notes}</p> : null}
                      {bill.paymentProof ? <p>Proof: {bill.paymentProof}</p> : null}
                      {bill.sharedWith?.length ? <p>Shared with: {bill.sharedWith.join(", ")}</p> : null}
                    </div>
                  )}

                  <div className="w-full max-w-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Paid progress</span>
                      <span>{formatCurrency(bill.paidAmount)} / {formatCurrency(bill.amount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${paidProgress}%` }}
                      />
                    </div>
                  </div>

                  {history.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {history.slice(0, 3).map((entry, index) => (
                        <Badge key={`${bill.id}-history-${index}`} variant="outline">
                          {entry.type} {entry.amount ? formatCurrency(entry.amount) : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold">{formatCurrency(bill.amount)}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() =>
                      setPaymentBill({
                        id: bill.id,
                        name: bill.name,
                        amount: Number(bill.amount || 0) - Number(bill.paidAmount || 0),
                        note: "",
                        paymentProof: bill.paymentProof || "",
                      })
                    }
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                    Pay
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() =>
                      setPaymentBill({
                        id: bill.id,
                        name: bill.name,
                        amount: "",
                        note: "Partial payment",
                        paymentProof: bill.paymentProof || "",
                      })
                    }
                  >
                    <WalletCards className="mr-2 h-4 w-4 text-blue-600" />
                    Partial
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => skipFn(bill.id, "Skipped from bill reminder")}
                  >
                    <SkipForward className="mr-2 h-4 w-4 text-amber-600" />
                    Skip
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    type="button"
                    onClick={() => setEditBill(createEditState(bill))}
                    aria-label="Edit bill"
                  >
                    <Pencil className="h-5 w-5 text-blue-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    type="button"
                    onClick={() => handleDelete(bill.id)}
                    aria-label="Delete bill"
                  >
                    <Trash className="h-5 w-5 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Drawer open={Boolean(editBill)} onOpenChange={(open) => !open && setEditBill(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Bill</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[80vh] overflow-y-auto px-4 pb-4">
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bill Name</label>
                <Input
                  value={editBill?.name || ""}
                  onChange={(event) => setEditBill((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Netflix / Rent / EMI"
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editBill?.amount ?? ""}
                    onChange={(event) => setEditBill((current) => ({ ...current, amount: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Predicted Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editBill?.estimatedAmount ?? ""}
                    onChange={(event) =>
                      setEditBill((current) => ({ ...current, estimatedAmount: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editBill?.dueDate || ""}
                  onChange={(event) => setEditBill((current) => ({ ...current, dueDate: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select
                    value={editBill?.recurringInterval || "one-time"}
                    onValueChange={(value) =>
                      setEditBill((current) => ({
                        ...current,
                        recurringInterval: value === "one-time" ? "" : value,
                      }))
                    }
                    disabled={!editBill?.isRecurring}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="One-time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editBill?.category || ""}
                    onChange={(event) => setEditBill((current) => ({ ...current, category: event.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={editBill?.priority || "ESSENTIAL"}
                    onValueChange={(value) => setEditBill((current) => ({ ...current, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESSENTIAL">Essential</SelectItem>
                      <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reminder Days</label>
                  <Input
                    value={editBill?.reminderDays || ""}
                    onChange={(event) =>
                      setEditBill((current) => ({ ...current, reminderDays: event.target.value }))
                    }
                    placeholder="7,3,1,0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shared With</label>
                <Input
                  value={editBill?.sharedWith || ""}
                  onChange={(event) => setEditBill((current) => ({ ...current, sharedWith: event.target.value }))}
                  placeholder="Partner, Roommate"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  value={editBill?.notes || ""}
                  onChange={(event) => setEditBill((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Proof URL</label>
                <Input
                  value={editBill?.paymentProof || ""}
                  onChange={(event) =>
                    setEditBill((current) => ({ ...current, paymentProof: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(editBill?.isRecurring)}
                    onChange={(event) =>
                      setEditBill((current) => ({ ...current, isRecurring: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border/60"
                  />
                  Recurring
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(editBill?.isAutoPay)}
                    onChange={(event) =>
                      setEditBill((current) => ({ ...current, isAutoPay: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border/60"
                  />
                  Auto-pay
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={Boolean(editBill?.isVariableAmount)}
                    onChange={(event) =>
                      setEditBill((current) => ({ ...current, isVariableAmount: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border/60"
                  />
                  Variable
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={updateLoading}>
                {updateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Bill"
                )}
              </Button>
              {hasActiveMutation && (
                <p className="text-xs text-muted-foreground">Saving bill changes…</p>
              )}
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(paymentBill)} onOpenChange={(open) => !open && setPaymentBill(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Record Payment</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <form className="space-y-4" onSubmit={handleRecordPayment}>
              <div className="rounded-2xl border border-border/60 bg-slate-50/70 p-4 text-sm dark:bg-slate-900/50">
                <p className="font-medium">{paymentBill?.name}</p>
                <p className="mt-1 text-muted-foreground">Track full or partial payments and attach proof.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentBill?.amount ?? ""}
                  onChange={(event) => setPaymentBill((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note</label>
                <Input
                  value={paymentBill?.note || ""}
                  onChange={(event) => setPaymentBill((current) => ({ ...current, note: event.target.value }))}
                  placeholder="UPI ref, split settlement, or payment note"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Proof URL</label>
                <Input
                  value={paymentBill?.paymentProof || ""}
                  onChange={(event) =>
                    setPaymentBill((current) => ({ ...current, paymentProof: event.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={paymentLoading}>
                {paymentLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Receipt className="mr-2 h-4 w-4" />
                    Save Payment
                  </>
                )}
              </Button>
              {skipLoading && (
                <p className="text-xs text-muted-foreground">
                  <Clock3 className="mr-1 inline h-3.5 w-3.5" />
                  Updating bill state...
                </p>
              )}
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BillRemindersList;
