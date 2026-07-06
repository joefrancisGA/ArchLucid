/**
 * Streamlined Core Pilot path copy — hides enterprise governance jargon until the tenant
 * has a committed architecture review (first finalized package).
 *
 * @see docs/CORE_PILOT.md · assessment improvement #1 (Tier 1 pilot UI path)
 */

/** Phrases that must not appear on pre-commit Core Pilot surfaces (case-insensitive). */
export const CORE_PILOT_PATH_BANNED_PHRASES: readonly string[] = ["governance", "policy pack"] as const;

export const CORE_PILOT_PATH_STREAMLINED_LABELS = {
  evaluationStandards: "Review standards",
  reviewWarnings: "Review warnings",
  approvalCheck: "Approval check",
  reviewApproval: "Review approval",
  /** ArchLucid platform defaults — not customer-configured standards (future tenant customization is out of scope here). */
  standardsAppliedTitle: "ArchLucid default standards applied automatically",
  standardsAppliedBody:
    "For your first review, ArchLucid evaluates against its default Security Architecture Baseline and FinOps & Cloud Cost Optimization standards — no manual assignment required.",
  focusedPilotToggleLabel: "Focused review scope",
  focusedPilotToggleDescription:
    "Limit this review to Security Architecture Baseline and FinOps & Cloud Cost Optimization standards so your first package stays actionable.",
  focusedPilotToggleAssistiveOn: "Evaluation is limited to security baseline and cost standards.",
  focusedPilotToggleAssistiveOff: "All enabled standards may contribute findings.",
  firstIntakeLead:
    "Upload one architecture diagram and add a short description if you want. Evaluation standards apply automatically.",
  firstIntakeAdvancedNote:
    "Focused review scope is on by default. Turn off only if you need every enabled standard to contribute findings.",
  streamlinedFirstReviewBanner:
    "Quick path: upload one diagram to start. Review scope is pre-configured.",
  operateUnlockLead:
    "Your first session focuses on starting and finalizing a review package. Compare, evidence graph, ask-this-review, and enterprise control routes stay hidden until you unlock them — or until you finalize your first review package.",
  operateUnlockAnalysisUnlocks: "Analysis — compare, graph, replay, and Q&A",
  operateUnlockStillHidden: "Enterprise controls — audit, alerts, and approval workflow (until you need them)",
  operateAutoUnlockHint:
    "Analysis tools are now in Administration — compare reviews, explore the evidence graph, and open digests when you need them. Enterprise control routes stay hidden until you unlock them.",
} as const;

/** True until the tenant has at least one committed architecture review. */
export function isStreamlinedCorePilotPath(hasCommittedArchitectureReview: boolean): boolean {
  return !hasCommittedArchitectureReview;
}

export function listCorePilotPathCopyViolations(
  surfaces: Readonly<Record<string, string>>,
): string[] {
  const violations: string[] = [];

  for (const [surfaceId, text] of Object.entries(surfaces)) {
    const normalized = text.toLowerCase();

    for (const phrase of CORE_PILOT_PATH_BANNED_PHRASES) {
      if (normalized.includes(phrase)) {
        violations.push(`${surfaceId}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}
