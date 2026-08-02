/** Canonical Fleet LLM COGS platform-admin dashboard. */
export const FLEET_LLM_COGS_PATH = "/admin/fleet-llm-cogs" as const;

export function isFleetLlmCogsPath(pathname: string): boolean {
  return pathname === FLEET_LLM_COGS_PATH || pathname.startsWith(`${FLEET_LLM_COGS_PATH}/`);
}
