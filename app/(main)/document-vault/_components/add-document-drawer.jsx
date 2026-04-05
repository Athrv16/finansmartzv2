"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FilePenLine, FilePlus2, Loader2 } from "lucide-react";
import { createVaultDocument, updateVaultDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const createInitialState = (document) => ({
  title: document?.title || "",
  tag: document?.tag || "",
  url: document?.url || "",
  note: document?.note || "",
  file: null,
});

export default function AddDocumentDrawer({ document = null, trigger = null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(createInitialState(document));
  const isEditMode = Boolean(document?.id);

  const actionFn = useMemo(() => (isEditMode ? updateVaultDocument : createVaultDocument), [isEditMode]);
  const { loading, fn, data } = useFetch(actionFn);

  useEffect(() => {
    setForm(createInitialState(document));
  }, [document, open]);

  useEffect(() => {
    if (!data?.id) return;
    toast.success(isEditMode ? "Document updated" : "Document added to vault");
    setForm(createInitialState(document));
    setOpen(false);
    router.refresh();
  }, [data, document, isEditMode, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("tag", form.tag);
    formData.append("url", form.url);
    formData.append("note", form.note);
    if (form.file) {
      formData.append("file", form.file);
    }

    if (isEditMode) {
      await fn(document.id, formData);
      return;
    }

    await fn(formData);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <Button className="rounded-xl bg-sky-600 text-white hover:bg-sky-700">
            <FilePlus2 className="h-4 w-4" />
            Add Document
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{isEditMode ? "Edit Document" : "Add Document"}</DrawerTitle>
          <DrawerDescription>
            {isEditMode
              ? "Update the saved document details or replace its PDF."
              : "Save a manual document link, note, or uploaded PDF into your vault."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Insurance policy / Tax file / Loan agreement"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag</label>
                <Input
                  value={form.tag}
                  onChange={(event) => setForm((current) => ({ ...current, tag: event.target.value }))}
                  placeholder="Tax / Insurance / Personal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload PDF</label>
              <Input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    file: event.target.files?.[0] || null,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Only PDF files are allowed. {isEditMode ? "Uploading a new file replaces the current saved PDF." : "Uploading a file will save it into your vault."}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Document URL</label>
              <Input
                value={form.url}
                onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                placeholder="Optional external PDF link"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note</label>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Add context or document details"
                className="min-h-24 w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving..."}
                </>
              ) : (
                <>
                  {isEditMode ? <FilePenLine className="mr-2 h-4 w-4" /> : null}
                  {isEditMode ? "Update Document" : "Save Document"}
                </>
              )}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
