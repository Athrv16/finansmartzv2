"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { del, put } from "@vercel/blob";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const isBlobUrl = (url) =>
  typeof url === "string" &&
  (url.includes(".public.blob.vercel-storage.com/") || url.includes("blob.vercel-storage.com/"));

const getCurrentUser = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
};

const serializeDocument = (doc) => ({
  ...doc,
  createdAt: doc.createdAt?.toISOString ? doc.createdAt.toISOString() : doc.createdAt,
  updatedAt: doc.updatedAt?.toISOString ? doc.updatedAt.toISOString() : doc.updatedAt,
});

const ensurePdf = (file) => {
  const isPdfType = file.type === "application/pdf";
  const hasPdfExtension = file.name?.toLowerCase().endsWith(".pdf");

  if (!isPdfType && !hasPdfExtension) {
    throw new Error("Only PDF documents are allowed");
  }
};

const uploadPdf = async (file) => {
  ensurePdf(file);

  const safeName = `${randomUUID()}.pdf`;

  if (BLOB_TOKEN) {
    const blob = await put(`vault-documents/${safeName}`, file, {
      access: "public",
      token: BLOB_TOKEN,
      contentType: "application/pdf",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "vault-documents");
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  return `/uploads/vault-documents/${safeName}`;
};

const deleteStoredPdf = async (url) => {
  if (!url) return;

  if (url.startsWith("/uploads/vault-documents/")) {
    const filePath = path.join(process.cwd(), "public", url);
    await unlink(filePath).catch(() => {});
    return;
  }

  if (isBlobUrl(url) && BLOB_TOKEN) {
    await del(url, { token: BLOB_TOKEN }).catch(() => {});
  }
};

export async function getVaultDocuments() {
  const user = await getCurrentUser();
  const docs = await db.vaultDocument.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return docs.map(serializeDocument);
}

export async function createVaultDocument(data) {
  const user = await getCurrentUser();
  const payload = data instanceof FormData
    ? {
        title: data.get("title"),
        url: data.get("url"),
        note: data.get("note"),
        tag: data.get("tag"),
        file: data.get("file"),
      }
    : data;

  if (!payload?.title || !String(payload.title).trim()) {
    throw new Error("Document title is required");
  }

  let documentUrl = payload.url ? String(payload.url).trim() : null;
  const file = payload?.file;

  if (file instanceof File && file.size > 0) {
    try {
      documentUrl = await uploadPdf(file);
    } catch (error) {
      throw new Error(error?.message || "Document upload failed. Please try again.");
    }
  }

  const created = await db.vaultDocument.create({
    data: {
      title: String(payload.title).trim(),
      type: "Manual Document",
      url: documentUrl,
      note: payload.note ? String(payload.note).trim() : null,
      tag: payload.tag ? String(payload.tag).trim() : null,
      userId: user.id,
    },
  });

  revalidatePath("/document-vault");
  return serializeDocument(created);
}

export async function updateVaultDocument(id, data) {
  const user = await getCurrentUser();
  const existing = await db.vaultDocument.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    throw new Error("Document not found");
  }

  const payload = data instanceof FormData
    ? {
        title: data.get("title"),
        url: data.get("url"),
        note: data.get("note"),
        tag: data.get("tag"),
        file: data.get("file"),
      }
    : data;

  if (!payload?.title || !String(payload.title).trim()) {
    throw new Error("Document title is required");
  }

  let documentUrl = payload.url !== undefined ? String(payload.url || "").trim() || null : existing.url;
  const file = payload?.file;

  if (file instanceof File && file.size > 0) {
    try {
      documentUrl = await uploadPdf(file);
      await deleteStoredPdf(existing.url);
    } catch (error) {
      throw new Error(error?.message || "Document upload failed. Please try again.");
    }
  }

  const updated = await db.vaultDocument.update({
    where: { id, userId: user.id },
    data: {
      title: String(payload.title).trim(),
      type: "Manual Document",
      url: documentUrl,
      note: payload.note ? String(payload.note).trim() : null,
      tag: payload.tag ? String(payload.tag).trim() : null,
    },
  });

  revalidatePath("/document-vault");
  return serializeDocument(updated);
}

export async function deleteVaultDocument(id) {
  const user = await getCurrentUser();
  const existing = await db.vaultDocument.findFirst({
    where: { id, userId: user.id },
  });

  if (!existing) {
    throw new Error("Document not found");
  }

  await db.vaultDocument.delete({
    where: { id, userId: user.id },
  });

  await deleteStoredPdf(existing.url);

  revalidatePath("/document-vault");
  return { success: true };
}
