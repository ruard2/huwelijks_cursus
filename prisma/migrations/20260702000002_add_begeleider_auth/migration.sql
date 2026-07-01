ALTER TABLE "Begeleider" ADD COLUMN "email" TEXT;
ALTER TABLE "Begeleider" ADD COLUMN "pinHash" TEXT;
ALTER TABLE "Begeleider" ADD COLUMN "pinSalt" TEXT;
ALTER TABLE "Begeleider" ADD COLUMN "emailToken" TEXT;
ALTER TABLE "Begeleider" ADD COLUMN "tokenExpiry" TIMESTAMP(3);
ALTER TABLE "Begeleider" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Begeleider" ADD COLUMN "coupleId" TEXT;
ALTER TABLE "Begeleider" ADD COLUMN "memberId" TEXT;
CREATE UNIQUE INDEX "Begeleider_email_key" ON "Begeleider"("email");
