/** Tracks example-template prefills for guided intake across wizard remounts on the same page session. */
const guidedIntakeExampleTemplatePrefillAppliedIds = new Set<string>();

export function hasGuidedIntakeExampleTemplatePrefillApplied(templateId: string): boolean {
  return guidedIntakeExampleTemplatePrefillAppliedIds.has(templateId);
}

export function markGuidedIntakeExampleTemplatePrefillApplied(templateId: string): void {
  guidedIntakeExampleTemplatePrefillAppliedIds.add(templateId);
}

/** Test-only reset for unit tests that simulate remount without a full navigation. */
export function resetGuidedIntakeExampleTemplatePrefillAppliedIdsForTests(): void {
  guidedIntakeExampleTemplatePrefillAppliedIds.clear();
}
