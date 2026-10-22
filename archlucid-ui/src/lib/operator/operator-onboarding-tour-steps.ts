/** Leaf module: operator first-run tour steps (no cross-imports — safe for client bundles). */

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

export const ONBOARDING_TOUR_WELCOME_BODY =
  "ArchLucid turns architecture evidence into findings, decisions, and reviews. Complete the steps in order, or jump ahead when you are ready.";

export const ONBOARDING_TOUR_NEW_REVIEW_BODY =
  `Use ${CREATE_ARCHITECTURE_LABEL} to open the guided intake. Each review begins with architecture evidence: a brief, uploaded files, or an optional cloud inventory ZIP.`;

export const ONBOARDING_TOUR_REVIEW_PACKAGES_BODY =
  "Completed reviews produce reviews with findings, evidence, decisions, and an audit trail. Track recent activity here, or open the full list when you need every review in the workspace.";

export const ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY =
  "Use Architecture to move between intake, evidence, reviews, and portfolio views. Administration stays collapsed unless you need tenant or project settings.";

export const ONBOARDING_TOUR_GET_HELP_BODY =
  "Open Help for the product guide, documentation index, and this tour. You can restart the tour anytime from Help.";

export const ONBOARDING_TOUR_READY_BODY =
  "Start with one review. Use the pilot checklist when you want a guided path from first review to governance sign-off.";

export const ONBOARDING_TOUR_DONE_LINK_LABEL = "Open pilot checklist";

export const ONBOARDING_TOUR_DONE_LINK_HREF = "/architecture/first-review-guide";

export type OperatorOnboardingTourStepCopy = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly targetSelector?: string;
};

/** Canonical six-step operator first-run tour copy — titles and bodies only. */
export const OPERATOR_ONBOARDING_TOUR_STEPS: readonly OperatorOnboardingTourStepCopy[] = [
  {
    id: "welcome",
    title: "Welcome to ArchLucid",
    body: ONBOARDING_TOUR_WELCOME_BODY,
    targetSelector: '[data-onboarding="tour-core-pilot"]',
  },
  {
    id: "new-run",
    title: "Start a review",
    body: ONBOARDING_TOUR_NEW_REVIEW_BODY,
    targetSelector: '[data-onboarding="tour-new-run"]',
  },
  {
    id: "runs",
    title: "Reviews",
    body: ONBOARDING_TOUR_REVIEW_PACKAGES_BODY,
    targetSelector: '[data-onboarding="tour-runs-dashboard"]',
  },
  {
    id: "disclose",
    title: "Follow the workflow",
    body: ONBOARDING_TOUR_FOLLOW_WORKFLOW_BODY,
    targetSelector: '[data-onboarding="tour-nav-settings"]',
  },
  {
    id: "help",
    title: "Get help",
    body: ONBOARDING_TOUR_GET_HELP_BODY,
    targetSelector: '[data-onboarding="tour-help"]',
  },
  {
    id: "done",
    title: "You are ready",
    body: ONBOARDING_TOUR_READY_BODY,
  },
] as const;
