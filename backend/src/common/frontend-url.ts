/**
 * Returns the primary frontend URL for use in email links, redirects, etc.
 *
 * FRONTEND_URL may contain comma-separated origins for CORS (e.g. "https://cim-amplify-five.vercel.app,https://example.com").
 * This helper always returns only the first (primary) origin.
 */
export const getFrontendUrl = (): string => {
  const raw = process.env.FRONTEND_URL || "https://cim-amplify-five.vercel.app"
  return raw.split(",")[0].trim().replace(/\/$/, "")
}
