ALTER TABLE "Couple" ADD COLUMN "email"          TEXT;
ALTER TABLE "Couple" ADD COLUMN "recoveryToken"  TEXT;
ALTER TABLE "Couple" ADD COLUMN "tokenExpiry"    TIMESTAMP(3);

ALTER TABLE "Member" ADD COLUMN "pinHash" TEXT;
ALTER TABLE "Member" ADD COLUMN "pinSalt" TEXT;
