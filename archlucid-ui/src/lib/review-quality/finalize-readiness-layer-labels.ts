const FINALIZE_READINESS_LAYER_LABELS: Readonly<Record<string, string>> = {
  "career-artifact": "Sealed record",
  integrity: "Integrity",
  governance: "Governance",
  scorecard: "Quality scorecard",
};

export function finalizeReadinessLayerLabel(layer: string): string {
  return FINALIZE_READINESS_LAYER_LABELS[layer] ?? layer;
}
