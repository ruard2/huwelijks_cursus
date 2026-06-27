CREATE TABLE "DynamicChapter" (
  "id"        TEXT NOT NULL,
  "deelId"    TEXT NOT NULL,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DynamicChapter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DynamicChapter_deelId_idx" ON "DynamicChapter"("deelId");
