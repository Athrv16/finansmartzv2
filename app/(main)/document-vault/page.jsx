import React from "react";
import { FileClock, FileText, Receipt, ShieldCheck } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { getBills } from "@/actions/bills";
import { getVaultDocuments } from "@/actions/documents";
import AddDocumentDrawer from "./_components/add-document-drawer";
import DocumentVaultList from "./_components/document-vault-list";

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(0)}`;

export default async function DocumentVaultPage() {
  const [transactions, bills, manualDocs] = await Promise.all([
    getDashboardData(),
    getBills(),
    getVaultDocuments(),
  ]);

  const receiptDocs = transactions
    .filter((tx) => tx.receiptUrl)
    .map((tx) => ({
      id: tx.id,
      title: tx.description || tx.category || "Transaction receipt",
      type: "Receipt",
      date: new Date(tx.date),
      meta: `${formatCurrency(tx.amount)} • ${tx.category}`,
      url: tx.receiptUrl,
    }));

  const billProofDocs = bills
    .filter((bill) => bill.paymentProof || bill.notes)
    .map((bill) => ({
      id: bill.id,
      title: bill.name,
      type: bill.paymentProof ? "Bill proof" : "Bill note",
      date: new Date(bill.updatedAt || bill.nextDueDate),
      meta: `${formatCurrency(bill.amount)} • ${bill.category || "bill"}`,
      url: bill.paymentProof || "",
      note: bill.notes || "",
    }));

  const customDocs = manualDocs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type || "Manual Document",
    date: new Date(doc.updatedAt || doc.createdAt),
    meta: doc.tag || "",
    url: doc.url || "",
    note: doc.note || "",
    tag: doc.tag || "",
    editable: true,
  }));

  const importedDocs = [
    ...receiptDocs.map((doc) => ({ ...doc, editable: false })),
    ...billProofDocs.map((doc) => ({ ...doc, editable: false })),
  ];

  const documents = [...customDocs, ...importedDocs].sort((a, b) => b.date - a.date);
  const secureDocs = documents.filter((doc) => doc.type === "Bill proof").length;

  return (
    <div className="space-y-8 px-2 pt-6 md:px-0 animate-fade-in" style={{ animation: "fadeIn 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-sky-50 via-white to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/40 blur-2xl dark:bg-sky-500/10" />
        <div className="absolute bottom-0 left-10 h-28 w-28 rounded-full bg-slate-200/40 blur-2xl dark:bg-slate-500/10" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">Documents</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              <span className="bg-gradient-to-r from-sky-600 to-slate-900 bg-clip-text text-transparent">
                Document Vault
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A central page for receipts, bill proofs, and saved financial references already present in your app data.
            </p>
          </div>
          <div className="rounded-3xl border border-sky-200 bg-white/85 p-5 shadow-sm dark:border-sky-500/20 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Stored Items</p>
            <p className="mt-3 text-5xl font-black tracking-tight">{documents.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Receipts</p>
            <Receipt className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{receiptDocs.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Imported from transaction receipts.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Bill Proofs</p>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{secureDocs}</p>
          <p className="mt-1 text-sm text-muted-foreground">Proof links saved inside bill reminders.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Manual Docs</p>
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">{customDocs.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Documents added directly from this page.</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Latest Activity</p>
            <FileClock className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight">
            {documents[0] ? documents[0].date.toLocaleDateString("en-IN") : "None"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Most recently updated document in the vault.</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-title">Vault Items</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Receipts, proofs, and bill records</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Combine manual vault entries with receipts and bill proofs in one place.
            </p>
          </div>
          <AddDocumentDrawer />
        </div>

        <DocumentVaultList documents={documents} />
      </section>
    </div>
  );
}
