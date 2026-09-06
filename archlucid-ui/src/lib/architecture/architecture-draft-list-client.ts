import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { getOperatorScopeQueryKeySnapshot } from "@/lib/operator/operator-scope-query-key";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Refreshes server-backed architecture draft inventory after mutations. */
export async function invalidateArchitectureDraftListQueries(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({
    queryKey: ["operator", "architecture", "draft-list"],
  });
}

/** Drops one draft from the cached hub inventory immediately after abandon/delete. */
export function removeArchitectureDraftFromListCache(draftId: string): void {
  const trimmedId = draftId.trim();

  if (trimmedId.length === 0) {
    return;
  }

  const scopeKey = getOperatorScopeQueryKeySnapshot();
  const queryKey = operatorQueryKeys.architectureDraftList(scopeKey);

  getOperatorQueryClient().setQueryData<ArchitectureDraftRegistryEntry[]>(queryKey, (current) => {
    if (current === undefined) {
      return current;
    }

    return current.filter((entry) => entry.draftId !== trimmedId);
  });
}

export function architectureDraftListQueryKey(scopeKey: string) {
  return operatorQueryKeys.architectureDraftList(scopeKey);
}
