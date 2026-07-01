CREATE TABLE "BegeleiderContentOverride" (
  "id"             TEXT NOT NULL,
  "key"            TEXT NOT NULL,
  "value"          TEXT NOT NULL,
  "begeleiderName" TEXT NOT NULL,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BegeleiderContentOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BegeleiderContentOverride_key_begeleiderName_key"
  ON "BegeleiderContentOverride"("key", "begeleiderName");

CREATE INDEX "BegeleiderContentOverride_begeleiderName_idx"
  ON "BegeleiderContentOverride"("begeleiderName");
