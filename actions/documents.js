"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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
    const isPdfType = file.type === "application/pdf";
    const hasPdfExtension = file.name?.toLowerCase().endsWith(".pdf");

    if (!isPdfType && !hasPdfExtension) {
      throw new Error("Only PDF documents are allowed");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "vault-documents");
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${randomUUID()}.pdf`;
    const filePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    documentUrl = `/uploads/vault-documents/${safeName}`;
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
    const isPdfType = file.type === "application/pdf";
    const hasPdfExtension = file.name?.toLowerCase().endsWith(".pdf");

    if (!isPdfType && !hasPdfExtension) {
      throw new Error("Only PDF documents are allowed");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "vault-documents");
    await mkdir(uploadDir, { recursive: true });

    const safeName = `${randomUUID()}.pdf`;
    const filePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    documentUrl = `/uploads/vault-documents/${safeName}`;

    if (existing.url?.startsWith("/uploads/vault-documents/")) {
      const previousPath = path.join(process.cwd(), "public", existing.url);
      await unlink(previousPath).catch(() => {});
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

  if (existing.url?.startsWith("/uploads/vault-documents/")) {
    const filePath = path.join(process.cwd(), "public", existing.url);
    await unlink(filePath).catch(() => {});
  }

  revalidatePath("/document-vault");
  return { success: true };
}
