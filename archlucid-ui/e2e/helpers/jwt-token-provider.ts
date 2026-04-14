/**
 * Live E2E JWT support for Playwright specs against `ArchLucidAuth:Mode=JwtBearer`.
 *
 * **Primary path:** `LIVE_JWT_TOKEN` — set by CI (`scripts/ci/mint_ci_jwt.py`) or manually for local runs.
 *
 * Optional Entra client-credentials (`LIVE_JWT_CLIENT_*`) can be wired later; callers should prefer a
 * pre-minted token for deterministic CI.
 */
export function getLiveJwtTokenFromEnvSync(): string {
  return process.env.LIVE_JWT_TOKEN?.trim() ?? "";
}

/** True when `LIVE_JWT_TOKEN` is non-empty (JWT auth lane active for `live-api-client` helpers). */
export function isLiveJwtTokenConfigured(): boolean {
  return getLiveJwtTokenFromEnvSync().length > 0;
}
