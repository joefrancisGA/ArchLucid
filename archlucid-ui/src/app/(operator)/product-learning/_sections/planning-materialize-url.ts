/** Builds the proxied POST URL for 59R planning materialization (query mirrors dashboard `since`). */
export function buildProductLearningPlanningMaterializeUrl(
  since: string | null | undefined,
  maxPlansToMaterialize: number,
): string {
  const base = "/api/proxy/v1/learning/planning/materialize";
  const clamped = Math.min(50, Math.max(1, Math.floor(maxPlansToMaterialize)));

  const params = new URLSearchParams();

  if (since !== null && since !== undefined && since.trim().length > 0) {
    params.set("since", since.trim());
  }

  params.set("maxPlansToMaterialize", String(clamped));

  return `${base}?${params.toString()}`;
}
