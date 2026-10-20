import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

export function governanceAssignedToMePathInspectFindingIdSet(
  rows: readonly GovernanceFindingQueueRow[],
): ReadonlySet<string> {
  const ids = rows
    .filter((row) => row.recordKind === "finding")
    .map((row) => row.findingId.trim())
    .filter((id) => id.length > 0);

  return new Set(ids);
}

/** Single bulk selection wins; otherwise honor a durable `findingId` cursor when it matches a visible row. */
export function resolveGovernanceAssignedToMePathInspectFindingId(input: {
  readonly selectedFindingIds: ReadonlySet<string>;
  readonly urlFindingId: string | null;
  readonly availableFindingIds: ReadonlySet<string>;
}): string | null {
  if (input.selectedFindingIds.size === 1) {
    const [onlyId] = input.selectedFindingIds;

    if (onlyId !== undefined && input.availableFindingIds.has(onlyId)) {
      return onlyId;
    }
  }

  const fromUrl = input.urlFindingId?.trim() ?? "";

  if (fromUrl.length > 0 && input.availableFindingIds.has(fromUrl)) {
    return fromUrl;
  }

  return null;
}
