import {
  ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED,
  ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED,
} from "@/lib/architecture/architecture-intelligence-findings";

export const ARCHITECTURE_INTELLIGENCE_INTEGRITY_OUTCOME_NOT_STORED =
  "Integrity outcome was not stored." as const;

export function formatArchitectureIntelligenceReasoningSeverity(
  severity: string | null | undefined,
): string {
  const trimmed = severity?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED;
}

export function formatArchitectureIntelligenceReasoningConclusion(
  conclusion: string | null | undefined,
): string {
  const trimmed = conclusion?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : ARCHITECTURE_INTELLIGENCE_FINDING_CONCLUSION_NOT_STORED;
}

export function formatArchitectureIntelligenceIntegrityLabel(input: {
  readonly findingId: string | null | undefined;
  readonly integritySet: ReadonlySet<string>;
  readonly validationPassed: boolean | null | undefined;
}): string {
  const findingId = input.findingId?.trim() ?? "";

  if (findingId.length === 0) {
    return ARCHITECTURE_INTELLIGENCE_INTEGRITY_OUTCOME_NOT_STORED;
  }

  if (input.integritySet.size > 0) {
    return input.integritySet.has(findingId)
      ? "passed"
      : "This finding id was not in the integrity-passed list.";
  }

  if (input.validationPassed != null) {
    return input.validationPassed ? "passed" : "failed";
  }

  return ARCHITECTURE_INTELLIGENCE_INTEGRITY_OUTCOME_NOT_STORED;
}
