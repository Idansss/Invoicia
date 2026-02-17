process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ?? "01234567890123456789012345678901";
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
process.env.APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";

process.env.SMTP_FROM =
  process.env.SMTP_FROM ?? "Invoicia <no-reply@invoicia.local>";
process.env.SMTP_HOST = process.env.SMTP_HOST ?? "localhost";
process.env.SMTP_PORT = process.env.SMTP_PORT ?? "1025";

process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.STORAGE_DIR = process.env.STORAGE_DIR ?? "storage-test";

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://invoicia:invoicia@localhost:5433/invoicia?schema=test";
}
