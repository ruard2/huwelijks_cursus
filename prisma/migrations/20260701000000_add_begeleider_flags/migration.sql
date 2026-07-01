ALTER TABLE "Couple" ADD COLUMN "begeleiderName" TEXT;

CREATE TABLE "Begeleider" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Begeleider_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Begeleider_name_key" ON "Begeleider"("name");

CREATE TABLE "QuestionFlag" (
  "id"             TEXT NOT NULL,
  "coupleCode"     TEXT NOT NULL,
  "memberNames"    TEXT NOT NULL,
  "begeleiderName" TEXT NOT NULL,
  "chapterId"      TEXT NOT NULL,
  "questionId"     TEXT NOT NULL,
  "questionText"   TEXT NOT NULL,
  "answerValue"    TEXT,
  "note"           TEXT,
  "read"           BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionFlag_begeleiderName_idx" ON "QuestionFlag"("begeleiderName");
CREATE INDEX "QuestionFlag_coupleCode_idx" ON "QuestionFlag"("coupleCode");
