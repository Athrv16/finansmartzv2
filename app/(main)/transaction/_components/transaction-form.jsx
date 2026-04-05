"use client";

import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { normalizeCategoryId } from "@/data/categories";
import useFetch from "@/hooks/use-fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, PlusCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";

const AddTransactionForm = ({ accounts, categories, editMode = false, initialData = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: normalizeCategoryId(initialData.category),
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
            recurringInterval: undefined,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const selectedAccountId = watch("accountId");
  const selectedCategory = watch("category");
  const selectedRecurringInterval = watch("recurringInterval");

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
      category: normalizeCategoryId(data.category),
    };

    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(editMode ? "Transaction Updated Successfully" : "Transaction Created Successfully");
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode, reset, router]);

  const filteredCategories = categories.filter((category) => category.type === type);

  const handleScanComplete = (scannedData) => {
    if (!scannedData) {
      return;
    }

    setValue("amount", scannedData.amount.toString());
    setValue("date", new Date(scannedData.date));

    if (scannedData.description) {
      setValue("description", scannedData.description);
    }

    if (scannedData.category) {
      const normalizedScannedCategory = normalizeCategoryId(scannedData.category);
      const matchedCategory = categories.find(
        (c) =>
          c.id === normalizedScannedCategory ||
          c.name.toLowerCase() === String(scannedData.category).toLowerCase()
      );
      if (matchedCategory) {
        setValue("category", matchedCategory.id);
      }
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

      <div className="grid gap-5 rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-900/70 md:grid-cols-2 md:p-5">
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <Select value={type} onValueChange={(value) => setValue("type", value)}>
          <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXPENSE">Expense</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input type="number" step="0.01" placeholder="0.00" {...register("amount")} className="bg-background" />
          {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Select value={selectedAccountId} onValueChange={(value) => setValue("accountId", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (₹{parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}

              <CreateAccountDrawer>
                <Button className="w-full justify-start gap-2 text-sm" variant="ghost" type="button">
                  <PlusCircle className="h-4 w-4" />
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && <p className="text-sm text-red-500">{errors.accountId.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={selectedCategory} onValueChange={(value) => setValue("category", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full pl-3 text-left font-normal">
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(nextDate) => setValue("date", nextDate)}
                disabled={(blockedDate) => blockedDate > new Date() || blockedDate < new Date("1900-01-01")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input placeholder="Enter description" {...register("description")} />
          {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Recurring Transaction</label>
            <p className="text-sm text-muted-foreground">Set up a recurring schedule for this transaction</p>
          </div>
          <Switch checked={isRecurring} onCheckedChange={(checked) => setValue("isRecurring", checked)} />
        </div>

        {isRecurring && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Recurring Interval</label>
            <Select
              value={selectedRecurringInterval}
              onValueChange={(value) => setValue("recurringInterval", value)}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>

            {errors.recurringInterval && <p className="text-sm text-red-500">{errors.recurringInterval.message}</p>}
          </div>
        )}
      </div>

      <div className="grid gap-3 pt-2 sm:grid-cols-2">
        <Button type="button" variant="outline" className="h-11" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" className="h-11" disabled={transactionLoading}>
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
