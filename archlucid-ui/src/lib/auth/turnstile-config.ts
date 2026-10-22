/** Public Cloudflare Turnstile site key for email-OTP bot challenge (server verifies with SecretKey). */
export function readTurnstileSiteKey(): string | null {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

  return siteKey.length > 0 ? siteKey : null;
}

export function isTurnstileBotChallengeConfigured(): boolean {
  return readTurnstileSiteKey() !== null;
}
