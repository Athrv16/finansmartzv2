"use client";

import { updateAccount, updateDefaultAccount } from "@/actions/accounts";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/app/lib/schema";
import { Switch } from "@/components/ui/switch";
import { Card, CardTitle, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Sparkles, Trash, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { deleteAccount } from "@/actions/accounts";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AccountCard = ({ account }) => {
  const { name, type, balance, id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updateDefaultResult,
    error,
  } = useFetch(updateDefaultAccount);

  const [editOpen, setEditOpen] = React.useState(false);

  const handleDefaultChange = async (event) => {
    event.preventDefault();

    if (isDefault) {
      toast.warning("You need atleast one default account");
      return;
    }

    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (updateDefaultResult?.success) {
      toast.success("Default account updated Successfully");
    }
  }, [updateDefaultResult, updateDefaultLoading]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update Default account");
    }
  }, [error]);

  const {
    loading: updateAccountLoading,
    fn: updateAccountFn,
    data: updateAccountResult,
  } = useFetch(updateAccount);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name,
      type,
      balance: String(balance ?? ""),
      isDefault,
    },
  });

  useEffect(() => {
    if (editOpen) {
      reset({
        name,
        type,
        balance: String(balance ?? ""),
        isDefault,
      });
    }
  }, [editOpen, name, type, balance, isDefault, reset]);

  useEffect(() => {
    if (updateAccountResult?.success) {
      toast.success("Account updated successfully");
      setEditOpen(false);
      return;
    }
    if (updateAccountResult && !updateAccountResult.success) {
      toast.error(updateAccountResult.error || "Failed to update account");
    }
  }, [updateAccountResult]);

  // Delete handler
  const handleDelete = async (event) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this account?")) {
      const res = await deleteAccount(id);
      if (res.success) {
        toast.success("Account deleted successfully");
      } else {
        toast.error(res.error || "Failed to delete account");
      }
    }
  };

  // Edit handler (placeholder)
  const handleEdit = (event) => {
    event.stopPropagation();
    setEditOpen(true);
  };

  const onSubmit = async (data) => {
    await updateAccountFn(id, data);
  };

  return (
    <Drawer open={editOpen} onOpenChange={setEditOpen}>
      <Card className="group relative overflow-hidden border-border/60 bg-white/85 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/60 hover:shadow-xl dark:bg-slate-900/70 dark:hover:border-blue-500/40">
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-blue-500/10" />
        {/* Edit and Delete icons, centered on hover */}
        <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleEdit}
            aria-label="Edit account"
            className="pointer-events-auto"
          >
            <Pencil className="h-5 w-5 text-blue-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDelete}
            aria-label="Delete account"
            className="pointer-events-auto"
          >
            <Trash className="h-5 w-5 text-red-500" />
          </Button>
        </div>
        <Link href={`/account/${id}`}>
        <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold capitalize">{name}</CardTitle>
            {isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                <Sparkles className="h-3 w-3" />
                Default
              </span>
            )}
          </div>
          <Switch checked={isDefault} onClick={handleDefaultChange} disabled={updateDefaultLoading} />
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-bold tracking-tight">₹{parseFloat(balance).toFixed(2)}</div>
          <p className="mt-1 text-xs text-muted-foreground">{type.charAt(0) + type.slice(1).toLowerCase()} account</p>
        </CardContent>
        <CardFooter className="relative z-10 flex justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
            Expense
          </div>
        </CardFooter>
        </Link>
      </Card>
      {/* Edit Drawer/Modal */}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <label htmlFor={`account-name-${id}`} className="text-sm font-medium">Account Name</label>
              <Input
                id={`account-name-${id}`}
                placeholder="e.g., Main Checking"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor={`account-type-${id}`} className="text-sm font-medium">Account Type</label>
              <Select
                onValueChange={(value) => setValue("type", value)}
                defaultValue={watch("type")}
              >
                <SelectTrigger id={`account-type-${id}`}>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor={`account-balance-${id}`} className="text-sm font-medium">Balance</label>
              <Input
                id={`account-balance-${id}`}
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <label htmlFor={`account-default-${id}`} className="text-sm font-medium cursor-pointer">
                  Set as Default
                </label>
                <p className="text-sm text-muted-foreground">
                  This account will be selected by default for transactions
                </p>
              </div>
              <Switch
                id={`account-default-${id}`}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
                checked={watch("isDefault")}
              />
            </div>
            <div className="flex gap-4 pt-4">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" className="flex-1" disabled={updateAccountLoading}>
                {updateAccountLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AccountCard;
