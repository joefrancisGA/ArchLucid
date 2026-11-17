import { governanceFindingsQueueAvailableFindingIdSet } from "@/lib/governance/governance-findings-queue-selection";

export const governanceAssignedToMePathInspectFindingIdSet = governanceFindingsQueueAvailableFindingIdSet;

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
