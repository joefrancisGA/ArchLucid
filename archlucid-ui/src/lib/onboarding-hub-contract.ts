/**
 * TB-680 — hub-page IA contract for customer-visible status surfaces.
 * Hub pages show completion status and deep-link; owning pages execute actions.
 */

/** Relative to `archlucid-ui/` — scanned by `onboarding-hub-drift-guard.test.ts`. */
export const HUB_PAGE_DRIFT_GUARD_SOURCES = [
  "src/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuidePageClient.tsx",
  "src/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideWalkthrough.tsx",
  "src/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideSupportPanel.tsx",
  "src/app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideRequiredSetupPanel.tsx",
  "src/app/(operator)/architecture/first-review-guide/_sections/OnboardingOptionalSetupSection.tsx",
  "src/app/(operator)/architecture/first-review-guide/_sections/OptionalWorkspaceSetupList.tsx",
  "src/components/GettingStartedTrialSection.tsx",
  "src/components/operator-home/OperatorHomeContinueSetupCard.tsx",
  "src/components/CorePilotChecklist.tsx",
  "src/components/operator-home/WorkspaceSetupHealthCallout.tsx",
  "src/components/operator-home/SystemHealthStatusStrip.tsx",
] as const;

/** Internal Operations / staff-only href prefixes that must not appear on hub surfaces. */
export const HUB_PAGE_FORBIDDEN_INTERNAL_HREF_PREFIXES = [
  "/internal/",
  "/internal/failed-integration-messages",
  "/insights/roi-summary",
] as const;

/** Embedded wizards/forms owned by settings or setup flows — hubs link out instead. */
export const HUB_PAGE_FORBIDDEN_EMBED_MARKERS = [
  "FinishSetupWizardPanel",
  "Tier2ConnectionWizard",
] as const;

export const HUB_PAGE_CONTRACT_DOC_SECTION = "Hub pages (TB-680)";

export type HubPageContractViolationKind = "forbidden-href" | "forbidden-embed";

export type HubPageContractViolation = {
  readonly kind: HubPageContractViolationKind;
  readonly marker: string;
};

export function findHubPageContractViolations(source: string): HubPageContractViolation[] {
  const violations: HubPageContractViolation[] = [];

  for (const prefix of HUB_PAGE_FORBIDDEN_INTERNAL_HREF_PREFIXES) {
    if (source.includes(prefix)) {
      violations.push({ kind: "forbidden-href", marker: prefix });
    }
  }

  for (const marker of HUB_PAGE_FORBIDDEN_EMBED_MARKERS) {
    if (source.includes(marker)) {
      violations.push({ kind: "forbidden-embed", marker });
    }
  }

  return violations;
}
