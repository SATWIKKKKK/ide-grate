import prisma from "../lib/prisma"

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE "Activity" SET "ide" = 'vscode' WHERE "ide" IS NULL OR "ide" = ''`)
  await prisma.$executeRawUnsafe(`UPDATE "DailyContribution" SET "ide" = 'vscode' WHERE "ide" IS NULL OR "ide" = ''`)

  await prisma.$executeRawUnsafe(`
    INSERT INTO "UserIdeSetup" ("id", "userId", "ide", "label", "isActive", "connectedAt", "createdAt", "updatedAt")
    SELECT
      concat('cmide', substr(md5("id" || 'vscode'), 1, 20)),
      "id",
      'vscode',
      'Visual Studio Code',
      true,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM "User"
    WHERE "apiKey" IS NOT NULL
    ON CONFLICT DO NOTHING
  `)

  console.log("Cadence IDE backfill completed.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
