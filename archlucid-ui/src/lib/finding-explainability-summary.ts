/**
 * Plain-language lines for Finding explainability "inspect-first" summaries (deterministic payloads only).
 */

export type FindingSeverityInspectCopy = {
  meaningForOperators: string;
  suggestedNext: string;
};

export function findingSeverityAudienceCopy(severityRaw: string): FindingSeverityInspectCopy {
  const trimmed = severityRaw.trim();
  const lowered = trimmed.toLowerCase();

  if (lowered.includes("critical") || lowered.includes(" blocker") || lowered === "blocking") {
    return {
      meaningForOperators:
        "Treated as highest urgency—the finding signals material delivery, compliance, or posture risk if unaddressed.",
      suggestedNext:
        "Get explicit owner acknowledgement (fix, time-bound waiver, or accepted residual risk) before broad rollout.",
    };
  }

  if (lowered.includes("high")) {
    return {
      meaningForOperators: "Elevated urgency: likely to affect rollout decisions or stakeholder trust if left unexplained.",
      suggestedNext:
        "Validate with owning teams soon and prioritize against neighboring findings rather than shelving quietly.",
    };
  }

  if (lowered.includes("medium") || lowered.includes("moderate")) {
    return {
      meaningForOperators: "Normal planning priority—meaningful gap, though not inherently drop-everything.",
      suggestedNext: "Schedule remediation or document an intentional acceptance rationale while context is fresh.",
    };
  }

  if (
    lowered.includes("low")
    || lowered.includes("info")
    || lowered.includes("informational")
    || lowered.includes("minor")
  ) {
    return {
      meaningForOperators: "Lower urgency housekeeping or tightening opportunity versus higher-severity items.",
      suggestedNext: "Batch with other backlog cleanup unless a narrow gate depends on this specific slice.",
    };
  }

  return {
    meaningForOperators: `The engine surfaced severity "${trimmed}". Compare neighbors and your severity rubric before locking priority.`,
    suggestedNext: "Contrast with sibling findings—relative ordering matters more than the label alone.",
  };
}


export function findingTraceCompletenessPlainEnglish(ratioPct: number): string {
  const r = Math.min(100, Math.max(0, Math.round(ratioPct)));

  if (!Number.isFinite(r)) {
    return "Trace completeness score is unavailable for this finding.";
  }

  if (r >= 90) {
    return "Trace completeness is strong—the deterministic footprint behind this finding looks well populated.";
  }

  if (r >= 60) {
    return "Trace completeness is mixed—fine for directional review, but expect a few sparse fields.";
  }

  if (r >= 30) {
    return "Trace completeness is thin—open the audit block before leaning on deterministic rationale alone.";
  }

  return "Trace completeness is minimal—treat the structured trace cautiously until you widen surrounding context.";
}


export function findingEvidenceCountPlainLine(evidenceRefs: readonly string[] | undefined | null): string {
  const n = evidenceRefs?.length ?? 0;

  if (n <= 0) {
    return "No structured evidence references were recorded.";
  }

  if (n === 1) {
    return "1 structured evidence reference was recorded.";
  }

  return `${n} structured evidence references were recorded.`;
}
