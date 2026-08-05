import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

/** Canonical workspace admin AI budget and usage reporting URL (TB-408). */
export const AI_USAGE_SETTINGS_PATH = "/administration/ai-usage";

/** Retired pre-release path — no redirect; use {@link AI_USAGE_SETTINGS_PATH}. */
export const AI_USAGE_COST_REPORTING_PATH = "/settings/cost-reporting";

/** Retired pre-release path — no redirect; use {@link AI_USAGE_SETTINGS_PATH}. */
export const AI_USAGE_LEGACY_ADMIN_PATH = "/admin/ai-usage-cost";

export function pathMatchesAiUsageSettings(pathname: string): boolean {
  return pathMatchesRoutePrefix(pathname, AI_USAGE_SETTINGS_PATH);
}
