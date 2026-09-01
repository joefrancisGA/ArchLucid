import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Refreshes server-backed architecture draft inventory after mutations. */
export async function invalidateArchitectureDraftListQueries(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({
    queryKey: ["operator", "architecture", "draft-list"],
  });
}

export function architectureDraftListQueryKey(scopeKey: string) {
  return operatorQueryKeys.architectureDraftList(scopeKey);
}
