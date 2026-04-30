/** Buyer-facing labels for well-known demo / sample run slugs (internal IDs stay in URL/query only). */
export function compareRunBuyerDisplayLabel(runId: string): string | null {
  const id = runId.trim();

  if (id === "claims-intake-run-v1")
    return "Baseline claims intake review";

  if (id === "claims-intake-run-v2")
    return "Updated claims intake review";

  return null;
}
