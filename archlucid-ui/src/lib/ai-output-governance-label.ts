export type AiOutputGovernanceKind = "governed" | "advisory";

export type AiOutputGovernanceLabelModel = {
  readonly kind: AiOutputGovernanceKind;
  readonly label: string;
  readonly title: string;
};

export const AI_OUTPUT_GOVERNANCE_LABELS = {
  governed: {
    label: "Tracked finding",
    title: "Persisted in the committed review with a stable FindingId.",
  },
  advisory: {
    label: "Advisory — not in review",
    title: "LLM narrative only — not persisted as a tracked finding in the review.",
  },
} as const;

/** Client-side rule: persisted FindingId => governed; otherwise advisory LLM output. */
export function deriveAiOutputGovernanceLabel(input: {
  readonly findingId?: string | null;
  readonly forceAdvisory?: boolean;
}): AiOutputGovernanceLabelModel {
  if (input.forceAdvisory === true) {
    return {
      kind: "advisory",
      ...AI_OUTPUT_GOVERNANCE_LABELS.advisory,
    };
  }

  const findingId = input.findingId?.trim() ?? "";

  if (findingId.length > 0) {
    return {
      kind: "governed",
      ...AI_OUTPUT_GOVERNANCE_LABELS.governed,
    };
  }

  return {
    kind: "advisory",
    ...AI_OUTPUT_GOVERNANCE_LABELS.advisory,
  };
}
