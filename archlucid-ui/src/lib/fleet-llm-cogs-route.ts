import { INTERNAL_FLEET_LLM_COGS_PATH } from "@/lib/internal-ops-route-paths";

/** Canonical Fleet LLM COGS Internal Operations dashboard. */
export const FLEET_LLM_COGS_PATH = INTERNAL_FLEET_LLM_COGS_PATH;

export function isFleetLlmCogsPath(pathname: string): boolean {
  return pathname === FLEET_LLM_COGS_PATH || pathname.startsWith(`${FLEET_LLM_COGS_PATH}/`);
}
