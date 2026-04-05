CREATE TABLE "vault_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT,
    "note" TEXT,
    "tag" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vault_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vault_documents_userId_idx" ON "vault_documents"("userId");

ALTER TABLE "vault_documents" ADD CONSTRAINT "vault_documents_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
