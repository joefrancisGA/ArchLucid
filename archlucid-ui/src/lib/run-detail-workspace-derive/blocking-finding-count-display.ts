/**
 * Maps a stored blocking-finding count onto chrome that needs a number.
 * `null`/`undefined`/non-finite means the count was not stored — unknown, not zero.
 */
export function resolveBlockingFindingCountPresentation(
  blockingFindingCount: number | null | undefined,
): { readonly known: boolean; readonly value: number } {
  if (typeof blockingFindingCount !== "number" || !Number.isFinite(blockingFindingCount)) {
    return { known: false, value: 0 };
  }

  return { known: true, value: Math.max(0, Math.trunc(blockingFindingCount)) };
}
