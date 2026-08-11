import { REVIEWS_NEW_PATH } from "@/lib/architecture-routes";
import { CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS } from "@/lib/cloud-connections-help-guide-content";
import {
  EVIDENCE_INTAKE_HELP_CANONICAL_PATH,
  EVIDENCE_INTAKE_HELP_PRIMARY_ACTION,
} from "@/lib/evidence-intake-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
  REVIEWS_NEW_PATH_HINTS,
  REVIEWS_NEW_QUICK_REVIEW_HREF,
  REVIEWS_NEW_QUICK_START_TAB_LABEL,
  REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";

export const EVIDENCE_INTAKE_HELP_PAGE_TITLE = "Start a review" as const;

export const EVIDENCE_INTAKE_HELP_HERO_OVERVIEW =
  "Attach architecture evidence, pick a starting path on New architecture review, then verify uploads before you finalize the architecture review.";

export const EVIDENCE_INTAKE_HELP_PATH_PANEL_TITLE = "Choose a starting path";

export const EVIDENCE_INTAKE_HELP_PATH_PANEL_INTRO =
  "Open the path that matches how much structure you already have — you can switch before analysis starts.";

export type EvidenceIntakeHelpPathOption = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
};

export const EVIDENCE_INTAKE_HELP_PATH_OPTIONS: readonly EvidenceIntakeHelpPathOption[] = [
  {
    id: "quick-review",
    label: REVIEWS_NEW_QUICK_START_TAB_LABEL,
    description: REVIEWS_NEW_PATH_HINTS["quick-review"],
    href: REVIEWS_NEW_QUICK_REVIEW_HREF,
  },
  {
    id: "guided-intake",
    label: REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
    description: REVIEWS_NEW_PATH_HINTS["guided-intake"],
    href: REVIEWS_NEW_GUIDED_INTAKE_HREF,
  },
  {
    id: "detailed",
    label: REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
    description: REVIEWS_NEW_PATH_HINTS.detailed,
    href: REVIEWS_NEW_DETAILED_HREF,
  },
] as const;

export const EVIDENCE_INTAKE_HELP_PRIMARY_ACTIONS = {
  startReview: EVIDENCE_INTAKE_HELP_PRIMARY_ACTION,
  openCloudConnections: {
    label: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label,
    href: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href,
  },
  openCloudConnectionsHelp: {
    label: "Cloud connections help",
    href: inAppHelpHref("cloud-connections"),
  },
} as const;

export type EvidenceIntakeHelpVerifyStep = {
  readonly title: string;
  readonly body: string;
  readonly action: { readonly label: string; readonly href: string };
};

export const EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_TITLE = "Verify intake before finalize";

export const EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_INTRO =
  "After you start a review, confirm evidence landed where you expect before you finalize the architecture review.";

/** Actionable verify steps — honest pending-state copy when no review id is known (TB-1354). */
export const EVIDENCE_INTAKE_HELP_VERIFY_STEPS: readonly EvidenceIntakeHelpVerifyStep[] = [
  {
    title: "Confirm uploads in the wizard",
    body: "Every selected file should appear in the upload list with the correct names before you start analysis.",
    action: { label: "New architecture review", href: REVIEWS_NEW_PATH },
  },
  {
    title: "Open the architecture review Evidence tab",
    body: "After analysis starts, open your in-progress review and use the Evidence tab to confirm attachments.",
    action: { label: "Architecture reviews", href: "/architecture/reviews" },
  },
  {
    title: "Resolve validation before finalize",
    body: "Fix upload or inventory ZIP validation messages on the review detail surface before you finalize.",
    action: { label: "Review guide", href: inAppHelpHref("review-guide") },
  },
] as const;

export type EvidenceIntakeHelpRelatedGuide = {
  readonly label: string;
  readonly href: string;
};

/** In-app related guides only — canonical first-review pointer (TB-1352). */
export const EVIDENCE_INTAKE_HELP_RELATED_GUIDES: readonly EvidenceIntakeHelpRelatedGuide[] = [
  { label: "Review guide", href: inAppHelpHref("review-guide") },
  { label: "Cloud connections", href: inAppHelpHref("cloud-connections") },
  { label: "Architecture reviews", href: inAppHelpHref("review-packages") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
] as const;

export const EVIDENCE_INTAKE_HELP_CANONICAL_ROUTE_PATH = EVIDENCE_INTAKE_HELP_CANONICAL_PATH;
