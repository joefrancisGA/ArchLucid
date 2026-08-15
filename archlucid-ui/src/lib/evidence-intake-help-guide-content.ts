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
  REVIEWS_NEW_QUICK_REVIEW_HREF,
  REVIEWS_NEW_QUICK_START_TAB_LABEL,
  REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";

export const EVIDENCE_INTAKE_HELP_PAGE_TITLE = "Start a review" as const;

export const EVIDENCE_INTAKE_HELP_HERO_OVERVIEW =
  "On New architecture review, attach architecture evidence, pick the path that matches how much structure you already have, then verify intake before you finalize the architecture package.";

export const EVIDENCE_INTAKE_HELP_PATH_PANEL_TITLE = "Choose a starting path";

export const EVIDENCE_INTAKE_HELP_PATH_PANEL_INTRO =
  "Open the path that matches how much structure you already have — you can switch before analysis starts.";

export type EvidenceIntakeHelpPathOption = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly href: string;
  readonly recommended?: boolean;
  readonly recommendedReason?: string;
};

export const EVIDENCE_INTAKE_HELP_PATH_OPTIONS: readonly EvidenceIntakeHelpPathOption[] = [
  {
    id: "quick-review",
    label: REVIEWS_NEW_QUICK_START_TAB_LABEL,
    description:
      "You want the fastest first review: title, optional attachments, required baseline clarifications, then start analysis on one screen.",
    actionLabel: "Open Quick start",
    href: REVIEWS_NEW_QUICK_REVIEW_HREF,
    recommended: true,
    recommendedReason: "Recommended for first review",
  },
  {
    id: "guided-intake",
    label: REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
    description: "You want clarifying questions and readiness checks before analysis begins.",
    actionLabel: "Open Guided questions",
    href: REVIEWS_NEW_GUIDED_INTAKE_HREF,
  },
  {
    id: "detailed",
    label: REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
    description:
      "You need templates, imports, or fuller configuration for an export-ready architecture package.",
    actionLabel: "Open Templates and imports",
    href: REVIEWS_NEW_DETAILED_HREF,
  },
] as const;

export const EVIDENCE_INTAKE_HELP_PATH_PANEL_FOOTNOTE =
  "For cloud inventory evidence, connect a cloud account first or read the cloud connections guide.";

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
  readonly action?: { readonly label: string; readonly href: string };
};

export const EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_TITLE = "Verify intake before finalize";

export const EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_INTRO =
  "Confirming that ArchLucid received the evidence you intended before you finalize the architecture package.";

/** Actionable verify steps — honest pending-state copy when no review id is known (TB-1354). */
export const EVIDENCE_INTAKE_HELP_VERIFY_STEPS: readonly EvidenceIntakeHelpVerifyStep[] = [
  {
    title: "Attachments listed",
    body: "Every file you selected appears in the upload list with the correct names.",
  },
  {
    title: "Analysis started",
    body: "After you start the architecture review, open the architecture package and confirm findings reference your uploads.",
    action: { label: "Architecture reviews", href: "/architecture/reviews" },
  },
  {
    title: "No blocking validation errors",
    body: "Resolve upload or ZIP validation messages before you commit or finalize.",
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
  { label: "Architecture packages", href: inAppHelpHref("review-packages") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
] as const;

export const EVIDENCE_INTAKE_HELP_CANONICAL_ROUTE_PATH = EVIDENCE_INTAKE_HELP_CANONICAL_PATH;

export type EvidenceIntakeHelpSourceDriftAnchor = {
  readonly id: string;
  readonly phrases: readonly string[];
};

/** Phrases that must appear in `docs/library/customer-facing/EVIDENCE_INTAKE_OPERATOR_GUIDE.md`. */
export const EVIDENCE_INTAKE_HELP_SOURCE_DRIFT_ANCHORS: readonly EvidenceIntakeHelpSourceDriftAnchor[] = [
  {
    id: "hero-overview",
    phrases: [
      "New architecture review",
      "architecture evidence",
      "how much structure you already have",
      "finalize the architecture package",
    ],
  },
  {
    id: "path-panel",
    phrases: ["Choose a starting path", "how much structure you already have"],
  },
  {
    id: "path-quick-start",
    phrases: [
      REVIEWS_NEW_QUICK_START_TAB_LABEL,
      "You want the fastest first review: title, optional attachments, required baseline clarifications, then start analysis on one screen.",
    ],
  },
  {
    id: "path-guided-questions",
    phrases: [REVIEWS_NEW_GUIDED_QUESTIONS_LABEL, "You want clarifying questions"],
  },
  {
    id: "path-templates-imports",
    phrases: [
      REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
      "You need templates, imports, or fuller configuration for an export-ready architecture package.",
    ],
  },
  {
    id: "verify-intake",
    phrases: [
      EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_TITLE,
      "confirming that ArchLucid received the evidence you intended before you finalize the architecture package",
    ],
  },
  {
    id: "verify-uploads",
    phrases: [
      "Attachments listed",
      "every file you selected appears in the upload list with the correct names",
    ],
  },
] as const;
