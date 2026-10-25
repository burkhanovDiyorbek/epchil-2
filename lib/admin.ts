/**
 * Admin access.
 *
 * Two ways to be an admin (both are enforced by firestore.rules, this file only drives the UI):
 *  1. A verified Google/email account listed in ADMIN_EMAILS (keep in sync with `isAdmin()` in firestore.rules).
 *  2. A document `admins/<uid>` created by hand in the Firebase console (no redeploy needed).
 */
const DEFAULT_ADMINS = "hojiyevdavron65@gmail.com,xojiyevdavron.uz@gmail.com,owakahoot@gmail.com";

export const ADMIN_EMAILS: string[] = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? DEFAULT_ADMINS)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
