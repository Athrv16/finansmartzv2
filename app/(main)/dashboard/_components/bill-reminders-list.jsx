"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Trash, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { deleteBill, updateBill } from "@/actions/bills";
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

const BillRemindersList = ({ bills, emptyMessage = "No bills yet. Add one above to start reminders." }) => {
  const router = useRouter();
  const [editBill, setEditBill] = useState(null);

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

  const handleEditOpen = (bill) => {
    setEditBill({
      id: bill.id,
      name: bill.name || "",
      amount: bill.amount ?? "",
      dueDate: normalizeDate(bill.dueDate || bill.nextDueDate),
      isRecurring: Boolean(bill.isRecurring),
      recurringInterval: bill.recurringInterval || "one-time",
    });
  };

  const handleDelete = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) {
      return;
    }
    await deleteFn(billId);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editBill) return;

    await updateFn(editBill.id, {
      name: editBill.name,
      amount: editBill.amount,
      dueDate: editBill.dueDate,
      isRecurring: editBill.isRecurring,
      recurringInterval: editBill.isRecurring ? editBill.recurringInterval || null : null,
    });
  };

  return (
    <>
      <div className="space-y-3">
        {bills.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        )}
        {bills.map((bill) => (
          <div
            key={bill.id}
            className="group relative flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm dark:bg-slate-900/70"
          >
            <div>
              <p className="font-semibold">{bill.name}</p>
              <p className="text-xs text-muted-foreground">
                Due {new Date(bill.nextDueDate).toLocaleDateString("en-IN")}
                {bill.isRecurring ? " • Recurring" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">
                ₹{Number(bill.amount).toFixed(0)}
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleEditOpen(bill);
                  }}
                  aria-label="Edit bill"
                >
                  <Pencil className="h-5 w-5 text-blue-500" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleDelete(bill.id);
                  }}
                  aria-label="Delete bill"
                >
                  <Trash className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={Boolean(editBill)} onOpenChange={(open) => !open && setEditBill(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Bill</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bill Name</label>
                <Input
                  value={editBill?.name || ""}
                  onChange={(event) =>
                    setEditBill((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Netflix / Rent / EMI"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editBill?.amount ?? ""}
                  onChange={(event) =>
                    setEditBill((current) => ({ ...current, amount: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editBill?.dueDate || ""}
                  onChange={(event) =>
                    setEditBill((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  required
                />
              </div>
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
              {deleteLoading && (
                <p className="text-xs text-muted-foreground">Deleting bill…</p>
              )}
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BillRemindersList;
