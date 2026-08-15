import { resolveFindingProvenance } from "@/lib/findings/finding-provenance-display";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function combinedFindingText(finding: QuickDecisionFinding): string {
  return `${finding.title}\n${finding.recommendation}\n${finding.aiReasoning.reasoningTrace}`;
}

function textIncludesAny(text: string, needles: readonly string[]): boolean {
  const lower = text.toLowerCase();

  for (const needle of needles) {
    if (lower.includes(needle)) {
      return true;
    }
  }

  return false;
}

function provenanceForFinding(finding: QuickDecisionFinding) {
  return resolveFindingProvenance({
    trustLabel: finding.trustLabel,
    policyRuleId: finding.policyRuleId,
    evidenceRefCount: finding.evidenceRefCount,
    confidenceLevel: finding.confidenceLevel,
  });
}

/** TB-2302: blocked checks and missing facts surface as questions, not confirmed Critical defects. */
export function isCannotDetermineReviewFinding(finding: QuickDecisionFinding): boolean {
  if (finding.isMuted) {
    return false;
  }

  const text = combinedFindingText(finding);

  if (
    textIncludesAny(text, [
      "cannot determine",
      "cannot verify",
      "insufficient evidence",
      "unable to verify",
      "cannot validate",
      "cannot confirm",
    ])
  ) {
    return true;
  }

  const provenance = provenanceForFinding(finding);

  if (provenance.grounding !== "Ungrounded" || finding.severityValue < 2) {
    return false;
  }

  return textIncludesAny(text, ["missing", "not found", "unknown", "not documented", "absent"]);
}

/** TB-2315: exploratory adversarial lane — verify before treating as publishable fact. */
export function isVerifyHypothesisReviewFinding(finding: QuickDecisionFinding): boolean {
  if (finding.isMuted) {
    return false;
  }

  const provenance = provenanceForFinding(finding);
  const label = (finding.trustLabel ?? "").trim();

  if (
    provenance.origin === "AI-generated"
    && provenance.grounding === "Ungrounded"
    && (label === "Heuristic" || label === "MissingCitation")
  ) {
    return true;
  }

  return textIncludesAny(combinedFindingText(finding), ["hypothesis", "exploratory challenge", "speculative"]);
}

/** TB-2310: diagram vs narrative and opposite conclusions on shared evidence. */
export function isContradictionReviewFinding(finding: QuickDecisionFinding): boolean {
  if (finding.isMuted) {
    return false;
  }

  const rule = (finding.policyRuleId ?? "").trim().toLowerCase();
  const text = combinedFindingText(finding);

  if (rule.includes("contradict")) {
    return true;
  }

  return textIncludesAny(text, ["contradict", "conflicts with", "opposite conclusion", "diagram vs"]);
}

/** TB-2308 / TB-2313 / TB-2314: requirement, failure-mode, and data-class coverage gaps. */
export function isCoverageGapReviewFinding(finding: QuickDecisionFinding): boolean {
  if (finding.isMuted) {
    return false;
  }

  const rule = (finding.policyRuleId ?? "").trim().toLowerCase();
  const text = combinedFindingText(finding);

  if (rule.includes("requirement-coverage") || rule.includes("requirement_coverage")) {
    return true;
  }

  if (textIncludesAny(text, ["uncovered requirement", "no design decision", "requirement lacks"])) {
    return true;
  }

  if (textIncludesAny(text, ["failure mode"]) && textIncludesAny(text, ["missing", "not documented", "unknown"])) {
    return true;
  }

  if (textIncludesAny(text, ["data classification", "data class"]) && textIncludesAny(text, ["unknown", "missing"])) {
    return true;
  }

  return false;
}
