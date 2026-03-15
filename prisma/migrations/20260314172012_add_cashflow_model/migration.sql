-- CreateTable
CREATE TABLE "cash_flow_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_flow_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_flow_events_userId_idx" ON "cash_flow_events"("userId");

-- AddForeignKey
ALTER TABLE "cash_flow_events" ADD CONSTRAINT "cash_flow_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
