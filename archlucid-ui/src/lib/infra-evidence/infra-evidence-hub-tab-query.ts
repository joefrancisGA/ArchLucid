import { applyInfraResourceHubTabParamOwnership } from "@/lib/operator/operator-url-selection-switch";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

/** Drop hub item-scoped query params that do not apply to the active tab. */
export function sanitizeResourceHubQueryForTab(
  currentSearch: string,
  tab: ResourceHubTab,
): string {
  const params = new URLSearchParams(currentSearch);

  applyInfraResourceHubTabParamOwnership(params, tab);

  return params.toString();
}
