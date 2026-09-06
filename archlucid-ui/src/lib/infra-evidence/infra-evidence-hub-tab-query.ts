import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  RESOURCE_HUB_CORRESPONDENCE_ID_PARAM,
  RESOURCE_HUB_DIFF_ID_PARAM,
  RESOURCE_HUB_FINDING_ID_PARAM,
  RESOURCE_HUB_INSTANCE_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
  RESOURCE_HUB_SEED_NODE_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";

/** Drop hub item-scoped query params that do not apply to the active tab. */
export function sanitizeResourceHubQueryForTab(
  currentSearch: string,
  tab: ResourceHubTab,
): string {
  const params = new URLSearchParams(currentSearch);

  if (tab !== "findings") {
    params.delete(RESOURCE_HUB_FINDING_ID_PARAM);
  }

  if (tab !== "drift") {
    params.delete(RESOURCE_HUB_DIFF_ID_PARAM);
  }

  if (tab !== "remediation") {
    params.delete(RESOURCE_HUB_INSTANCE_ID_PARAM);
  }

  if (tab !== "diagram") {
    params.delete(RESOURCE_HUB_CORRESPONDENCE_ID_PARAM);
    params.delete(RESOURCE_HUB_SEED_NODE_ID_PARAM);
  }

  if (tab !== "diagram" && tab !== "remediation" && tab !== "overview") {
    params.delete(RESOURCE_HUB_RUN_ID_PARAM);
  }

  return params.toString();
}
