export function resolveBlockingFindingCountPresentation(
  blockingFindingCount: number | undefined,
): { readonly known: boolean; readonly value: number } {
  if (typeof blockingFindingCount !== "number" || !Number.isFinite(blockingFindingCount)) {
    return { known: false, value: 0 };
  }

  return { known: true, value: Math.max(0, Math.trunc(blockingFindingCount)) };
}
