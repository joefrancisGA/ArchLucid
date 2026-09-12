import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { readGovernanceFindingsReturnHref } from "@/lib/governance/governance-findings-return-state";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { assignedToMeFindingsPathForProductLine } from "@/lib/product-line/securenow-assigned-to-me-route";

export type ResolveGovernanceFindingsQueueHeaderNavHrefInput = {
  readonly isAssignedToMe: boolean;
  readonly workingMode?: boolean;
  readonly scopedArchitectureId?: string | null;
  readonly pathname?: string | null;
  readonly productLineId?: ProductLineId;
};

function parseArchitectureIdFromNestedFindingsPath(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";
  const match = /^\/architecture\/architectures\/([^/]+)\/findings(\/|$)/.exec(path);

  if (match === null) {
    return null;
  }

  const architectureId = decodeURIComponent(match[1]).trim();

  return architectureId.length > 0 ? architectureId : null;
}

/** SG-030: governance findings opened from the desk return to the architecture, not platform Home. */
export function resolveGovernanceFindingsQueueHeaderNavHref(
  input: ResolveGovernanceFindingsQueueHeaderNavHrefInput,
): string {
  if (input.isAssignedToMe) {
    return assignedToMeFindingsPathForProductLine(input.productLineId ?? "architecture");
  }

  const pathnameArchitectureId = parseArchitectureIdFromNestedFindingsPath(input.pathname ?? "");

  if (pathnameArchitectureId !== null) {
    return architectureIdentityPath(pathnameArchitectureId);
  }

  const scopedArchitectureId = input.scopedArchitectureId?.trim() ?? "";

  if (input.workingMode === true && scopedArchitectureId.length > 0) {
    return architectureIdentityPath(scopedArchitectureId);
  }

  if (input.workingMode === true) {
    const persistedArchitectureId = parseArchitectureIdFromNestedFindingsPath(
      readGovernanceFindingsReturnHref(),
    );

    if (persistedArchitectureId !== null) {
      return architectureIdentityPath(persistedArchitectureId);
    }
  }

  return GOVERNANCE_FINDINGS_PATH;
}
