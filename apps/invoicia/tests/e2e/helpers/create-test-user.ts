/**
 * Creates a test E2E user in the database if one doesn't exist already.
 * Run once before authenticated E2E tests:
 *   npx dotenv-cli -e ../../.env -- npx tsx tests/e2e/helpers/create-test-user.ts
 *
 * The user is created with:
 *   email:    e2e-test@invoicia.local
 *   password: E2eTest123!
 *
 * These credentials are set as E2E_EMAIL / E2E_PASSWORD in your .env.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../../src/server/password";

const prisma = new PrismaClient();

const TEST_EMAIL = "e2e-test@invoicia.local";
const TEST_PASSWORD = "E2eTest123!";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });

  if (existing) {
    console.log(`✓ Test user already exists: ${TEST_EMAIL}`);
    // Make sure there's at least one org membership so the app shell doesn't
    // redirect to /onboarding during authenticated tests
    const membership = await prisma.membership.findFirst({ where: { userId: existing.id } });
    if (!membership) {
      const org = await prisma.organization.create({
        data: {
          name: "E2E Test Org",
          email: TEST_EMAIL,
          currency: "USD",
          timezone: "America/New_York",
          invoicePrefix: "E2E",
        },
      });
      await prisma.membership.create({
        data: { userId: existing.id, orgId: org.id, role: "OWNER" },
      });
      console.log("  → Created org + membership for test user");
    }
    return;
  }

  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: { name: "E2E Test User", email: TEST_EMAIL, passwordHash },
  });

  const org = await prisma.organization.create({
    data: {
      name: "E2E Test Org",
      email: TEST_EMAIL,
      currency: "USD",
      timezone: "America/New_York",
      invoicePrefix: "E2E",
    },
  });

  await prisma.membership.create({
    data: { userId: user.id, orgId: org.id, role: "OWNER" },
  });

  console.log(`✓ Created test user: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  console.log("\nAdd to your .env:");
  console.log(`E2E_EMAIL=${TEST_EMAIL}`);
  console.log(`E2E_PASSWORD=${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
