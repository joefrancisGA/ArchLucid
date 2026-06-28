import { pathMatchesRoutePrefix } from "@/lib/governance-route-paths";

/** Canonical workspace admin AI budget and usage reporting URL (TB-408). */
export const AI_USAGE_SETTINGS_PATH = "/settings/ai-usage";

/** App Router implementation path — rewrite target for {@link AI_USAGE_SETTINGS_PATH}. */
export const AI_USAGE_COST_REPORTING_PATH = "/settings/cost-reporting";

/** Internal-only AI processing queue and dead-letter diagnostics. */
export const AI_COST_DIAGNOSTICS_PATH = "/admin/ai-cost-diagnostics";

/** Legacy Internal Operations href — redirects to {@link AI_USAGE_SETTINGS_PATH}. */
export const AI_USAGE_LEGACY_ADMIN_PATH = "/admin/ai-usage-cost";

export function pathMatchesAiUsageSettings(pathname: string): boolean {
  return (
    pathMatchesRoutePrefix(pathname, AI_USAGE_SETTINGS_PATH)
    || pathMatchesRoutePrefix(pathname, AI_USAGE_COST_REPORTING_PATH)
    || pathMatchesRoutePrefix(pathname, AI_USAGE_LEGACY_ADMIN_PATH)
  );
}
