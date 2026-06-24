/** Policy reference token sent when focused pilot mode is enabled on review intake. */
export const FOCUSED_PILOT_MODE_POLICY_REFERENCE = "pilot-mode:security-baseline-cost-only";

/** Bundled packs applied automatically during focused first-run intake (matches backend FocusedPilotModePolicyPacks). */
export const FOCUSED_PILOT_MODE_PACK_DISPLAY_NAMES = [
  "Security Architecture Baseline",
  "FinOps & Cloud Cost Optimization",
] as const;

export const FOCUSED_PILOT_MODE_COPY = {
  toggleLabel: "Focused pilot mode",
  toggleDescription:
    "Limit this review to Security Architecture Baseline and FinOps & Cloud Cost Optimization policy packs so your first package stays actionable.",
  appliedCalloutTitle: "Customer policy packs applied automatically",
  appliedCalloutBody:
    "This first review evaluates against Security Architecture Baseline and FinOps & Cloud Cost Optimization — no manual pack assignment required.",
  toggleAssistiveOn: "Policy evaluation is limited to security baseline and cost packs.",
  toggleAssistiveOff: "All enabled policy packs may contribute findings.",
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
