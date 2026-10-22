import { navHrefPathPart } from "@/lib/nav-href-path-part";
import {
  GOVERNANCE_FINDINGS_BULK_PARAM,
  parseGovernanceFindingsBulkSelectionFromSearch,
} from "@/lib/governance/governance-findings-bulk-selection-url";
import {
  REMEDIATION_FACTORY_FINDING_ID_PARAM,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-url-state";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export type GovernanceFindingsQueueDeskUrlPatch = {
  readonly bulkFindingIds: readonly string[];
  readonly pathInspectFindingId: string | null;
};

export function governanceFindingsQueueDeskHrefFromSearch(
  currentSearch: string,
  pathname: string,
  patch: GovernanceFindingsQueueDeskUrlPatch,
): string {
  const resolvedPath = navHrefPathPart(pathname);

  return buildOperatorHrefFromSearch(currentSearch, resolvedPath, {
    selectionSwitch: { kind: "governance-findings-queue-navigation" },
    mutate: (params) => {
      const bulkIds = patch.bulkFindingIds.map((id) => id.trim()).filter((id) => id.length > 0);

      if (bulkIds.length === 0) {
        params.delete(GOVERNANCE_FINDINGS_BULK_PARAM);
      } else {
        params.set(GOVERNANCE_FINDINGS_BULK_PARAM, bulkIds.join(","));
      }

      if (patch.pathInspectFindingId === null) {
        params.delete(REMEDIATION_FACTORY_FINDING_ID_PARAM);
      } else {
        params.set(REMEDIATION_FACTORY_FINDING_ID_PARAM, patch.pathInspectFindingId);
      }
    },
  });
}

export function resolveGovernanceFindingsQueuePathInspectFindingIdForDeskUrl(
  bulkFindingIds: readonly string[],
): string | null {
  if (bulkFindingIds.length === 1) {
    const [onlyId] = bulkFindingIds;

    return onlyId ?? null;
  }

  return null;
}

export function resolveGovernanceFindingsQueueDeskSelectionFromSearch(
  currentSearch: string,
  availableFindingIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const fromBulk = parseGovernanceFindingsBulkSelectionFromSearch(
    new URLSearchParams(currentSearch).get(GOVERNANCE_FINDINGS_BULK_PARAM),
  ).filter((id) => availableFindingIds.has(id));

  if (fromBulk.length > 0) {
    return new Set(fromBulk);
  }

  const fromFindingId = new URLSearchParams(currentSearch).get(REMEDIATION_FACTORY_FINDING_ID_PARAM)?.trim() ?? "";

  if (fromFindingId.length > 0 && availableFindingIds.has(fromFindingId)) {
    return new Set([fromFindingId]);
  }

  return new Set();
}
