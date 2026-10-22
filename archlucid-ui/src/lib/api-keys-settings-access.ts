/**
 * Operator UI for API key management (Administration → API keys, Users hub keys tab).
 *
 * Owner decision (2026-08-08): park this surface until product maturity needs
 * host automation credentials in-product. Prefer invite + roles for people.
 * Host keys remain configurable via deployment / Key Vault; re-enable here when
 * Internal Operations (or equivalent) is ready to own the workflow.
 */
export function isApiKeysSettingsSurfaceEnabled(): boolean {
  return false;
}
