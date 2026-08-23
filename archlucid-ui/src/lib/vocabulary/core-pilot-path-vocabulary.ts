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
    "For your first review, ArchLucid evaluates against its default architecture-quality standards — Security, Reliability, Cost, Performance, Operational Excellence, and Sustainability — no manual assignment required.",
  focusedPilotToggleLabel: "Focused review scope",
  focusedPilotToggleDescription:
    "Limit this review to the six architecture-quality standards (Security, Reliability, Cost, Performance, Operational Excellence, and Sustainability) so your first package stays actionable.",
  focusedPilotToggleAssistiveOn:
    "Evaluation is limited to the six architecture-quality baseline standards.",
  focusedPilotToggleAssistiveOff: "All enabled standards may contribute findings.",
  /**
   * Two-option review-scope choice on first-run intake. Replaces an inverted checkbox where
   * unchecking silently widened scope — both outcomes are now stated side by side.
   */
  reviewScopeChoiceLegend: "Which standards should evaluate this review?",
  reviewScopeRecommendedLabel: "Recommended standards (default)",
  reviewScopeRecommendedDescription:
    "Use ArchLucid's six default architecture-quality standards. Keeps your first review shorter and the findings actionable.",
  reviewScopeAllLabel: "Every standard enabled for this workspace",
  reviewScopeAllDescription:
    "Any standard your workspace has enabled can also contribute findings. Expect a longer review and more findings to work through.",
  firstIntakeLead:
    "Attach a diagram or document when you can, or describe enough architecture context to review without files. Evaluation standards apply automatically.",
  firstIntakeAdvancedNote:
    "Focused review scope is on by default. Turn off only if you need every enabled standard to contribute findings.",
  streamlinedFirstReviewBannerLabel: "Quick path:",
  streamlinedFirstReviewBannerBody:
    "attach evidence or describe your architecture to start. Review scope is pre-configured.",
  operateUnlockLead:
    "Your first session focuses on starting and finalizing a review. Compare, evidence graph, ask-this-review, and enterprise control routes stay hidden until you unlock them — or until you finalize your first review.",
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
