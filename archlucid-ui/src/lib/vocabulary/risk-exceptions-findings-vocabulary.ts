/**
 * TB-2249 — Risk exceptions ≠ Findings vocabulary rail.
 *
 * Why two approval surfaces exist:
 * - Risk exceptions (`/governance/exceptions`) is the *waiver register* for
 *   time-bounded exceptions against findings (renew / revoke).
 * - Findings queue (`/governance/findings`) is the cross-review *risk register*
 *   for disposition, ownership, and exception work on the underlying findings.
 *
 * They stay separate because granting or renewing a risk exception does not
 * dispose the finding, and disposing a finding is not the same as managing
 * the exception register. Operators need both surfaces with deep links so they
 * do not treat waivers as the findings queue (or the reverse).
 */

import {
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type RiskExceptionsFindingsSurfaceId = "risk-exceptions" | "findings-queue";

export type RiskExceptionsFindingsLink = {
  readonly id: RiskExceptionsFindingsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type RiskExceptionsFindingsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly riskExceptionsLink: RiskExceptionsFindingsLink;
  readonly findingsLink: RiskExceptionsFindingsLink;
};

export const RISK_EXCEPTIONS_FINDINGS_HEADING =
  "Risk exceptions and findings stay separate" as const;

export const RISK_EXCEPTIONS_FINDINGS_WHY_TWO =
  "Risk exceptions are temporary approvals to accept a known risk — renew or revoke them here. The findings queue is where you resolve and assign findings. Approving a waiver does not close a finding, and closing a finding is not the same as managing the exception list." as const;

export const RISK_EXCEPTIONS_FINDINGS_COMPACT_LINE =
  "Risk exceptions approve known risks temporarily; the findings queue resolves findings — open the other when you need both." as const;

export const RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK: RiskExceptionsFindingsLink = {
  id: "risk-exceptions",
  label: "Risk exceptions",
  href: GOVERNANCE_EXCEPTIONS_PATH,
  whenToUse: "Renew or revoke temporary risk approvals for findings.",
};

export const RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK: RiskExceptionsFindingsLink = {
  id: "findings-queue",
  label: "Findings queue",
  href: GOVERNANCE_FINDINGS_PATH,
  whenToUse: "Resolve findings, assign owners, and clear open approval items.",
};

/** Pairwise model for Risk exceptions ↔ Findings queue (fixed governance routes). */
export function buildRiskExceptionsFindingsPairwiseRail(): PairwiseVocabularyRailModel<RiskExceptionsFindingsSurfaceId> {
  return {
    heading: RISK_EXCEPTIONS_FINDINGS_HEADING,
    whyTwo: RISK_EXCEPTIONS_FINDINGS_WHY_TWO,
    compactLine: RISK_EXCEPTIONS_FINDINGS_COMPACT_LINE,
    currentLink: RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK,
    peerLink: RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildRiskExceptionsFindingsVocabulary(): RiskExceptionsFindingsVocabularyModel {
  const rail = buildRiskExceptionsFindingsPairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    riskExceptionsLink: rail.currentLink,
    findingsLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveRiskExceptionsFindingsPeerLink(
  currentSurfaceId: RiskExceptionsFindingsSurfaceId,
): RiskExceptionsFindingsLink {
  if (currentSurfaceId === "risk-exceptions") {
    return RISK_EXCEPTIONS_FINDINGS_FINDINGS_LINK;
  }

  return RISK_EXCEPTIONS_FINDINGS_RISK_EXCEPTIONS_LINK;
}
