import validator from "validator";
import { promises as dns } from "dns";

/**
 * Validates an email address with two layers:
 * 1. Format check via validator.isEmail (handles TLD requirements, etc.)
 * 2. Optional MX record check to confirm the domain can receive email.
 *    DNS failures are silently ignored so legitimate emails are never blocked.
 */
export async function validateEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!email?.trim()) {
    return { ok: false, error: "Email is required." };
  }

  if (!validator.isEmail(email, { allow_utf8_local_part: false })) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const domain = email.split("@")[1];

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { ok: false, error: "This email domain doesn't appear to be valid." };
    }
  } catch {
    // DNS lookup failed (timeout, NXDOMAIN, etc.) — allow the email through
  }

  return { ok: true };
}
