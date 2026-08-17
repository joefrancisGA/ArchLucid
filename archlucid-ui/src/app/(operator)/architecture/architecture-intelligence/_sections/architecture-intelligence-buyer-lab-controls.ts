/**
 * Lab-only Architecture Intelligence controls that must not appear on the buyer route.
 * Test ids must stay aligned with ArchitectureIntelligencePageClient.
 */
export const ARCHITECTURE_INTELLIGENCE_BUYER_HIDDEN_LAB_CONTROL_TEST_IDS = [
  "architecture-intelligence-golden-test-button",
  "architecture-intelligence-load-fixture-button",
] as const;

/** Hides golden-test and fixture buttons after they mount (often after product-context load). */
export function hideArchitectureIntelligenceBuyerLabControls(root: ParentNode): void {
  for (const testId of ARCHITECTURE_INTELLIGENCE_BUYER_HIDDEN_LAB_CONTROL_TEST_IDS) {
    const control = root.querySelector(`[data-testid="${testId}"]`);

    if (!(control instanceof HTMLElement)) {
      continue;
    }

    control.hidden = true;
    control.setAttribute("aria-hidden", "true");
    control.tabIndex = -1;
  }
}
