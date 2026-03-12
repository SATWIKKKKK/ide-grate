-- AlterTable
ALTER TABLE "UserGoal" ADD COLUMN     "achieved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "achievedAt" TIMESTAMP(3),
ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "targetDate" DATE;

-- CreateIndex
CREATE INDEX "UserGoal_userId_targetDate_idx" ON "UserGoal"("userId", "targetDate");
