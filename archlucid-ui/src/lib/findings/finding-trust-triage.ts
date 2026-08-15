import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  resolveFindingProvenance,
  type FindingProvenanceDisplay,
  type FindingProvenanceGrounding,
  type FindingProvenanceOrigin,
} from "@/lib/findings/finding-provenance-display";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

export type FindingTrustTriageBand =
  | "deterministic-rule"
  | "evidence-backed"
  | "verify"
  | "question"
  | "simulated";

const ORIGIN_FILTER_ALL = "all" as const;
const GROUNDING_FILTER_ALL = "all" as const;

export type FindingOriginFilter = typeof ORIGIN_FILTER_ALL | FindingProvenanceOrigin;
export type FindingGroundingFilter = typeof GROUNDING_FILTER_ALL | FindingProvenanceGrounding;

const TRUST_BAND_ORDER: readonly FindingTrustTriageBand[] = [
  "deterministic-rule",
  "evidence-backed",
  "verify",
  "question",
  "simulated",
];

function provenanceFromReviewFinding(finding: QuickDecisionFinding): FindingProvenanceDisplay {
  return resolveFindingProvenance({
    trustLabel: finding.trustLabel,
    policyRuleId: finding.policyRuleId,
    evidenceRefCount: finding.evidenceRefCount,
    confidenceLevel: finding.confidenceLevel,
  });
}

function provenanceFromGovernanceRow(row: GovernanceFindingQueueRow): FindingProvenanceDisplay {
  return resolveFindingProvenance({
    policyRuleId: row.policyRuleId,
    evidenceRefCount: row.evidenceRefCount,
  });
}

/** Maps origin × grounding onto the triage sort band. */
export function findingTrustTriageBand(provenance: FindingProvenanceDisplay): FindingTrustTriageBand {
  if (provenance.origin === "Simulated") {
    return "simulated";
  }

  if (provenance.origin === "Deterministic rule") {
    return "deterministic-rule";
  }

  if (provenance.origin === "Deterministic fallback") {
    return "verify";
  }

  if (provenance.grounding === "Evidence-backed") {
    return "evidence-backed";
  }

  if (provenance.grounding === "Estimated" || provenance.grounding === "Degraded") {
    return "verify";
  }

  return "question";
}

/** True when a disposed finding may enter the sponsor-packet job view without an override. */
export function isFindingSponsorPacketTrustEligible(provenance: FindingProvenanceDisplay): boolean {
  const band = findingTrustTriageBand(provenance);

  return band === "deterministic-rule" || band === "evidence-backed";
}

export function isReviewFindingSponsorPacketTrustEligible(finding: QuickDecisionFinding): boolean {
  return isFindingSponsorPacketTrustEligible(provenanceFromReviewFinding(finding));
}

export function isGovernanceRowSponsorPacketTrustEligible(row: GovernanceFindingQueueRow): boolean {
  return isFindingSponsorPacketTrustEligible(provenanceFromGovernanceRow(row));
}

export function reviewFindingMatchesProvenanceFilter(
  finding: QuickDecisionFinding,
  originFilter: FindingOriginFilter,
  groundingFilter: FindingGroundingFilter,
): boolean {
  const provenance = provenanceFromReviewFinding(finding);

  if (originFilter !== ORIGIN_FILTER_ALL && provenance.origin !== originFilter) {
    return false;
  }

  if (groundingFilter !== GROUNDING_FILTER_ALL && provenance.grounding !== groundingFilter) {
    return false;
  }

  return true;
}

export function compareFindingsByTrustThenSeverity(
  left: QuickDecisionFinding,
  right: QuickDecisionFinding,
): number {
  const leftBand = TRUST_BAND_ORDER.indexOf(findingTrustTriageBand(provenanceFromReviewFinding(left)));
  const rightBand = TRUST_BAND_ORDER.indexOf(findingTrustTriageBand(provenanceFromReviewFinding(right)));

  if (leftBand !== rightBand) {
    return leftBand - rightBand;
  }

  return right.severityValue - left.severityValue || left.findingOrder - right.findingOrder;
}
