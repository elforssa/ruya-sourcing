/**
 * Startup environment variable validation.
 * Imported by lib/prisma.ts so it runs on every cold start.
 * Throws immediately if any required server-side variable is missing.
 */

const REQUIRED = [
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXTAUTH_URL",
  "RESEND_API_KEY",
] as const;

type RequiredEnv = (typeof REQUIRED)[number];

function validateEnv(): Record<RequiredEnv, string> {
  // Only run on the server — Next.js edge/browser bundles skip this file
  if (typeof window !== "undefined") {
    return {} as Record<RequiredEnv, string>;
  }

  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `\n\n[env] ❌ Missing required environment variables:\n` +
      missing.map((k) => `  - ${k}`).join("\n") +
      `\n\nCopy .env.example to .env.local and fill in all values.\n`
    );
  }

  return Object.fromEntries(
    REQUIRED.map((k) => [k, process.env[k]!])
  ) as Record<RequiredEnv, string>;
}

export const env = validateEnv();
