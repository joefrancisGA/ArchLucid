import { listFindingDispositions } from "@/lib/api/governance-stickiness-api";
import { resolveExpectedCurrentDispositionRowVersion } from "@/lib/findings/finding-expected-current-disposition-row-version";

/**
 * Load current-pointer tokens for bulk disposition. Findings with no pointer are omitted
 * so the server treats them as first writes.
 */
export async function collectExpectedCurrentDispositionRowVersionByFindingId(
  findingIds: readonly string[],
): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(findingIds.map((findingId) => findingId.trim()).filter((findingId) => findingId.length > 0))];
  const entries = await Promise.all(
    uniqueIds.map(async (findingId) => {
      const history = await listFindingDispositions(findingId);
      const expectedCurrentDispositionRowVersionBase64 = resolveExpectedCurrentDispositionRowVersion({
        latestHistoryEvent: history[0] ?? null,
      });

      if (expectedCurrentDispositionRowVersionBase64 === undefined) {
        return null;
      }

      return [findingId, expectedCurrentDispositionRowVersionBase64] as const;
    }),
  );

  const map: Record<string, string> = {};

  for (const entry of entries) {
    if (entry === null) {
      continue;
    }

    map[entry[0]] = entry[1];
  }

  return map;
}
