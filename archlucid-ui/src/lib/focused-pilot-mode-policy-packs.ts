import { CORE_PILOT_PATH_STREAMLINED_LABELS } from "@/lib/vocabulary/core-pilot-path-vocabulary";

/** Policy reference token sent when focused pilot mode is enabled on review intake. */
export const FOCUSED_PILOT_MODE_POLICY_REFERENCE = "pilot-mode:security-baseline-cost-only";

/** Canonical help copy for focused review scope — shared by /help/review-guide and doc guards (TB-764). */
export const REVIEW_SCOPE_HELP_EXPLANATION =
  "By default, your first review is evaluated against six architecture-quality standards — Security Architecture Baseline, Reliability and Resilience, FinOps & Cloud Cost Optimization, Performance and Scalability, Operational Excellence, and Sustainability and Resource Efficiency. Open Review standards selection to turn this off and use every standard enabled for your workspace instead.";

/** Disambiguates review scope (standards) from workspace/tenant scope (TB-764). */
export const REVIEW_SCOPE_WORKSPACE_DISAMBIGUATION =
  "Review scope controls which standards evaluate your design; it is not the same as workspace or tenant scope.";

/** Bundled packs applied automatically during focused first-run intake (matches backend FocusedPilotModePolicyPacks). */
export const FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES = [
  "Security Architecture Baseline",
  "Reliability and Resilience",
  "FinOps & Cloud Cost Optimization",
  "Performance and Scalability",
  "Operational Excellence",
  "Sustainability and Resource Efficiency",
] as const;

export const FOCUSED_PILOT_MODE_COPY = {
  toggleLabel: CORE_PILOT_PATH_STREAMLINED_LABELS.focusedPilotToggleLabel,
  toggleDescription: CORE_PILOT_PATH_STREAMLINED_LABELS.focusedPilotToggleDescription,
  appliedCalloutTitle: CORE_PILOT_PATH_STREAMLINED_LABELS.standardsAppliedTitle,
  appliedCalloutBody: CORE_PILOT_PATH_STREAMLINED_LABELS.standardsAppliedBody,
  toggleAssistiveOn: CORE_PILOT_PATH_STREAMLINED_LABELS.focusedPilotToggleAssistiveOn,
  toggleAssistiveOff: CORE_PILOT_PATH_STREAMLINED_LABELS.focusedPilotToggleAssistiveOff,
  choiceLegend: CORE_PILOT_PATH_STREAMLINED_LABELS.reviewScopeChoiceLegend,
  choiceRecommendedLabel: CORE_PILOT_PATH_STREAMLINED_LABELS.reviewScopeRecommendedLabel,
  choiceRecommendedDescription: CORE_PILOT_PATH_STREAMLINED_LABELS.reviewScopeRecommendedDescription,
  choiceAllLabel: CORE_PILOT_PATH_STREAMLINED_LABELS.reviewScopeAllLabel,
  choiceAllDescription: CORE_PILOT_PATH_STREAMLINED_LABELS.reviewScopeAllDescription,
} as const;

/** Create-architecture intake — scope card copy (distinct from review quick-start toggle). */
export const FOCUSED_PILOT_MODE_CREATION_COPY = {
  sectionLabel: "Initial review focus",
  focusedDescription:
    "Your first review starts with the standards below. You can add more standards later.",
  expandedDescription:
    "All enabled standards may contribute findings. You can narrow scope again before starting a review.",
  changeFocusAction: "Change review focus",
  focusedAssistiveOn: "Initial review is limited to the selected standards shown.",
  focusedAssistiveOff: "All enabled standards may contribute findings.",
} as const;

/** Adds or removes the focused pilot policy reference token. */
export function applyFocusedPilotModePolicyReferences(
  policyReferences: readonly string[],
  enabled: boolean,
): string[] {
  const withoutToken = policyReferences.filter(
    (reference) => reference.trim().toLowerCase() !== FOCUSED_PILOT_MODE_POLICY_REFERENCE,
  );

  if (!enabled) {
    return withoutToken;
  }

  return [...withoutToken, FOCUSED_PILOT_MODE_POLICY_REFERENCE];
}
