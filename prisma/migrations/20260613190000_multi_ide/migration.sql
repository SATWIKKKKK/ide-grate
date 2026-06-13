-- Cadence multi-IDE telemetry support.
ALTER TABLE "Activity" ADD COLUMN IF NOT EXISTS "ide" TEXT NOT NULL DEFAULT 'vscode';
ALTER TABLE "DailyContribution" ADD COLUMN IF NOT EXISTS "ide" TEXT NOT NULL DEFAULT 'vscode';

CREATE TABLE IF NOT EXISTS "UserIdeSetup" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ide" TEXT NOT NULL,
  "label" TEXT,
  "apiKey" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastHeartbeat" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserIdeSetup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserIdeSetup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "UserIdeSetup" ("id", "userId", "ide", "label", "apiKey", "isActive", "connectedAt", "createdAt", "updatedAt")
SELECT
  concat('cmide', substr(md5("id" || 'vscode'), 1, 20)),
  "id",
  'vscode',
  'Visual Studio Code',
  NULL,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE "apiKey" IS NOT NULL
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS "DailyContribution_userId_date_key";
CREATE UNIQUE INDEX IF NOT EXISTS "DailyContribution_userId_date_ide_key" ON "DailyContribution"("userId", "date", "ide");

CREATE UNIQUE INDEX IF NOT EXISTS "UserIdeSetup_userId_ide_key" ON "UserIdeSetup"("userId", "ide");
CREATE UNIQUE INDEX IF NOT EXISTS "UserIdeSetup_apiKey_key" ON "UserIdeSetup"("apiKey");
CREATE INDEX IF NOT EXISTS "UserIdeSetup_userId_idx" ON "UserIdeSetup"("userId");
CREATE INDEX IF NOT EXISTS "UserIdeSetup_userId_ide_idx" ON "UserIdeSetup"("userId", "ide");
CREATE INDEX IF NOT EXISTS "UserIdeSetup_ide_idx" ON "UserIdeSetup"("ide");

CREATE INDEX IF NOT EXISTS "Activity_userId_ide_idx" ON "Activity"("userId", "ide");
CREATE INDEX IF NOT EXISTS "Activity_userId_ide_startTime_idx" ON "Activity"("userId", "ide", "startTime");
CREATE INDEX IF NOT EXISTS "DailyContribution_userId_ide_idx" ON "DailyContribution"("userId", "ide");
CREATE INDEX IF NOT EXISTS "DailyContribution_userId_date_ide_idx" ON "DailyContribution"("userId", "date", "ide");
