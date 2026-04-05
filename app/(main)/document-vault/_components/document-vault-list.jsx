"use client";

import React, { useEffect } from "react";
import { FolderLock, Link2, Pencil, Trash } from "lucide-react";
import { deleteVaultDocument } from "@/actions/documents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AddDocumentDrawer from "./add-document-drawer";
import useFetch from "@/hooks/use-fetch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function DocumentVaultList({ documents }) {
  const router = useRouter();
  const { loading, fn, data } = useFetch(deleteVaultDocument);

  useEffect(() => {
    if (!data?.success) return;
    toast.success("Document deleted");
    router.refresh();
  }, [data, router]);

  const handleDelete = async (document) => {
    if (!window.confirm(`Delete "${document.title}" from the vault?`)) return;
    await fn(document.id);
  };

  return (
    <div className="space-y-3">
      {documents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-800/70 dark:bg-slate-900/50">
          No documents have been captured yet. Once you attach receipts, bill proofs, or add a manual document, they will appear here.
        </div>
      ) : documents.map((doc) => (
        <div key={`${doc.type}-${doc.id}`} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-slate-50/70 p-4 dark:bg-slate-900/50">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{doc.title}</p>
              {doc.type !== "Manual Document" ? (
                <Badge variant="outline">{doc.type}</Badge>
              ) : null}
            </div>
            {doc.meta ? <p className="text-sm text-muted-foreground">{doc.meta}</p> : null}
            {doc.note ? <p className="text-sm text-muted-foreground">{doc.note}</p> : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">{doc.date.toLocaleDateString("en-IN")}</span>
            <div className="flex items-center gap-2">
              {doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Open
                </a>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                  <FolderLock className="h-3.5 w-3.5" />
                  Internal note
                </div>
              )}
              {doc.editable ? (
                <>
                  <AddDocumentDrawer
                    document={doc}
                    trigger={
                      <Button size="icon" variant="ghost" className="h-8 w-8" type="button" aria-label="Edit document">
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    type="button"
                    onClick={() => handleDelete(doc)}
                    disabled={loading}
                    aria-label="Delete document"
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
