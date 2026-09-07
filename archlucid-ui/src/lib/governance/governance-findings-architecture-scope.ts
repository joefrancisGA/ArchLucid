import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export const GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_ALL = "all";

export function scopedArchitectureIdFromQuery(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";

  if (trimmed.length === 0 || trimmed.toLowerCase() === GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_ALL) {
    return null;
  }

  return trimmed;
}

export function resolveGovernanceFindingsArchitectureScopeFromUrl(
  raw: string | null | undefined,
  defaultArchitectureId: string | null,
): { readonly architectureId: string | null; readonly explicit: boolean } {
  if (raw === null || raw.trim().length === 0) {
    return { architectureId: defaultArchitectureId, explicit: false };
  }

  if (raw.trim().toLowerCase() === GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_ALL) {
    return { architectureId: null, explicit: true };
  }

  return { architectureId: raw.trim(), explicit: true };
}

export function buildGovernanceFindingsArchitectureRunIdSet(input: {
  readonly architectureId: string;
  readonly architectureReviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
}): ReadonlySet<string> {
  const runIds = new Set<string>();
  const normalizedArchitectureId = input.architectureId.trim();

  for (const review of input.architectureReviews) {
    const runId = review.runId.trim();

    if (runId.length > 0) {
      runIds.add(runId);
    }
  }

  for (const entry of input.draftRegistryEntries ?? []) {
    const parentArchitectureId = entry.parentArchitectureId?.trim() ?? "";
    const linkedReviewId = entry.linkedReviewId?.trim() ?? "";

    if (parentArchitectureId === normalizedArchitectureId && linkedReviewId.length > 0) {
      runIds.add(linkedReviewId);
    }
  }

  return runIds;
}

export function matchesGovernanceFindingsArchitectureScope(
  row: GovernanceFindingQueueRow,
  scopedRunIds: ReadonlySet<string> | null,
): boolean {
  if (scopedRunIds === null) {
    return true;
  }

  if (scopedRunIds.size === 0) {
    return false;
  }

  const normalizedRunId = row.runId.trim().toLowerCase();

  for (const runId of scopedRunIds) {
    if (runId.trim().toLowerCase() === normalizedRunId) {
      return true;
    }
  }

  return false;
}

export function governanceFindingsArchitectureScopeHrefFromSearch(
  currentSearch: string,
  architectureId: string | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (architectureId === null) {
    params.set("architectureId", GOVERNANCE_FINDINGS_ARCHITECTURE_SCOPE_ALL);
  } else {
    params.set("architectureId", architectureId);
  }

  const query = params.toString();

  return query.length === 0 ? pathname : `${pathname}?${query}`;
}

export function deriveGovernanceFindingsArchitectureScopeHonesty(
  allRows: readonly GovernanceFindingQueueRow[],
  architectureScopedRows: readonly GovernanceFindingQueueRow[],
  architectureFilterActive: boolean,
): { readonly hiddenCount: number; readonly line: string | null } {
  if (!architectureFilterActive) {
    return { hiddenCount: 0, line: null };
  }

  const hiddenCount = Math.max(0, allRows.length - architectureScopedRows.length);

  if (hiddenCount <= 0) {
    return { hiddenCount: 0, line: null };
  }

  return {
    hiddenCount,
    line: `${hiddenCount} finding${hiddenCount === 1 ? "" : "s"} from other architectures hidden`,
  };
}
