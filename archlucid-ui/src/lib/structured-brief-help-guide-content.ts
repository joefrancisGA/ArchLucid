import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
import { ARCHITECTURES_NEW_HELP_TOPIC_LABEL } from "@/lib/architectures-new-evidence-copy";
import {
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_PAGE_LOCAL,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER,
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE,
} from "@/lib/architecture-draft-start-review-checklist";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFT_ALTERNATIVES_HINT } from "@/lib/create-vs-review-intake-copy";
import {
  ARCHITECTURE_OPEN_QUESTIONS_HELPER,
  ARCHITECTURE_OPEN_QUESTIONS_LABEL,
} from "@/lib/architecture/architecture-open-questions-copy";
import {
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
  GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER,
  GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT,
  GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT,
  GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
  GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER,
  GUIDED_INTAKE_STRUCTURED_BRIEF_OPTIONAL_FIELDS_NOTE,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL,
} from "@/lib/guided-intake-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/structured-brief-help-evidence-copy";
import {
  SCOPE_UNDERSTANDING_ADD_EFFECT_HINT,
  SCOPE_UNDERSTANDING_HEADING,
  SCOPE_UNDERSTANDING_HELPER,
} from "@/lib/architecture/architecture-scope-understanding-shared";
import {
  STRUCTURED_BRIEF_CAPABILITIES_QUALITY_COMPACT_LINE,
  STRUCTURED_BRIEF_CAPABILITIES_QUALITY_HEADING,
  STRUCTURED_BRIEF_CAPABILITIES_QUALITY_WHY_TWO,
} from "@/lib/vocabulary/structured-brief-capabilities-quality-vocabulary";

export const STRUCTURED_BRIEF_HELP_BREADCRUMB_TOPIC_TITLE = ARCHITECTURES_NEW_HELP_TOPIC_LABEL;

export const STRUCTURED_BRIEF_HELP_PAGE_EYEBROW = "Help topic" as const;

export const STRUCTURED_BRIEF_HELP_PAGE_TITLE = ARCHITECTURES_NEW_HELP_TOPIC_LABEL;

export const STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE =
  "Field-by-field guidance for the create and edit architecture workspace — from naming the system through structured brief, scope confirmation, and starting a review.";

export const STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE_BUYER =
  "Plain-language guidance for describing your architecture before evidence intake." as const;

export const STRUCTURED_BRIEF_HELP_PRIMARY_CONTENT_ID = "help-structured-brief-primary-content" as const;

export const STRUCTURED_BRIEF_HELP_SKIP_LINK_LABEL = "Skip to create architecture guide" as const;

export function structuredBriefHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE_BUYER
    : STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE;
}

export const STRUCTURED_BRIEF_HELP_OVERVIEW =
  "Use the create architecture workspace to describe the system, confirm structured brief facts, and start a review when readiness checks pass. Saving an architecture draft does not submit anything for review until you explicitly start one.";

export const CREATE_ARCHITECTURE_HELP_DRAFT_VS_REVIEW_HEADING_ID = "help-create-architecture-draft-vs-review" as const;

export const CREATE_ARCHITECTURE_HELP_DRAFT_VS_REVIEW_HEADING = "Architecture draft vs. review" as const;

export const CREATE_ARCHITECTURE_HELP_DRAFT_VS_REVIEW_LEAD = GUIDED_INTAKE_CREATION_DRAFT_GUIDANCE_CALLOUT;

export const CREATE_ARCHITECTURE_HELP_DRAFT_VS_REVIEW_DETAIL =
  `Save and return anytime from ${ARCHITECTURE_DRAFTS_LIST_LABEL}. Starting an architecture review is a separate step — use Start architecture review when the architecture draft includes confirmed constraints, assumptions, a quality target, and actors a junior architect could reconstruct the system from.` as const;

export const CREATE_ARCHITECTURE_HELP_READINESS_CHECKLIST_HEADING_ID = "help-create-architecture-readiness-checklist" as const;

export const CREATE_ARCHITECTURE_HELP_READINESS_CHECKLIST_HEADING = ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_TITLE;

export const CREATE_ARCHITECTURE_HELP_READINESS_CHECKLIST_BODY = ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_PAGE_LOCAL;

export const CREATE_ARCHITECTURE_HELP_READINESS_CHECKLIST_WITH_BANNER_BODY =
  ARCHITECTURE_DRAFT_START_REVIEW_CHECKLIST_DESCRIPTION_WITH_BANNER;

export type CreateArchitectureHelpFieldTip = {
  readonly label: string;
  readonly detail: string;
};

export const CREATE_ARCHITECTURE_HELP_FIELD_TIPS_HEADING_ID = "help-create-architecture-field-tips" as const;

export const CREATE_ARCHITECTURE_HELP_FIELD_TIPS_HEADING = "Form fields" as const;

export const CREATE_ARCHITECTURE_HELP_FIELD_TIPS: readonly CreateArchitectureHelpFieldTip[] = [
  {
    label: GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL,
    detail: "Use a stable product or system name reviewers will recognize in lists and handoffs.",
  },
  {
    label: GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_LABEL,
    detail: `${GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER} ${ARCHITECTURE_DRAFT_ALTERNATIVES_HINT}`,
  },
  {
    label: GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_LABEL,
    detail: GUIDED_INTAKE_CREATION_BUSINESS_OUTCOME_MIN_HELPER,
  },
  {
    label: "People, systems, and integrations",
    detail: GUIDED_INTAKE_CREATION_PEOPLE_SYSTEMS_HINT,
  },
  {
    label: GUIDED_INTAKE_STRUCTURED_BRIEF_SECTION_LABEL,
    detail: `Confirm constraints and assumptions so review engines do not invent them from free text alone. ${GUIDED_INTAKE_STRUCTURED_BRIEF_OPTIONAL_FIELDS_NOTE} Suggestions stay unconfirmed until you add or confirm them.`,
  },
  {
    label: "Constraints",
    detail: "Hard limits the architecture must not violate — budget, regions, compliance. Leave empty if none are stated.",
  },
  {
    label: "Assumptions",
    detail: "Facts agents may rely on unless evidence contradicts them. Leave empty if none are stated.",
  },
  {
    label: GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
    detail: GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_HINT,
  },
  {
    label: GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
    detail: GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_HINT,
  },
  {
    label: SCOPE_UNDERSTANDING_HEADING,
    detail: `${SCOPE_UNDERSTANDING_HELPER} ${SCOPE_UNDERSTANDING_ADD_EFFECT_HINT}`,
  },
  {
    label: ARCHITECTURE_OPEN_QUESTIONS_LABEL,
    detail: ARCHITECTURE_OPEN_QUESTIONS_HELPER,
  },
] as const;

export const CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_HEADING_ID = "help-create-architecture-capabilities-quality" as const;

export const CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_HEADING = STRUCTURED_BRIEF_CAPABILITIES_QUALITY_HEADING;

export const CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_BODY = STRUCTURED_BRIEF_CAPABILITIES_QUALITY_WHY_TWO;

export const CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_EXAMPLES =
  "HTTPS ingress and managed database are capabilities; RTO 4h and p95 latency 200ms are quality attributes." as const;

export const CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_COMPACT = STRUCTURED_BRIEF_CAPABILITIES_QUALITY_COMPACT_LINE;

export const STRUCTURED_BRIEF_HELP_PRIMARY_ACTION = {
  label: "Create architecture",
  href: ARCHITECTURES_NEW_PATH,
} as const;

export type StructuredBriefHelpConceptItem = {
  readonly label: string;
  readonly detail: string;
  readonly examples: readonly string[];
  readonly antiPatterns: readonly string[];
};

export const STRUCTURED_BRIEF_HELP_CONCEPT_ITEMS: readonly StructuredBriefHelpConceptItem[] = [
  {
    label: "Constraints",
    detail: "Hard limits the design must respect — region, residency, budget caps, or compliance boundaries.",
    examples: ["EU data residency required", "No public internet ingress"],
    antiPatterns: ["Be secure", "Follow best practices"],
  },
  {
    label: "Assumptions",
    detail: "Facts you are treating as true for this architecture draft even if they are not verified yet.",
    examples: ["Single-region deployment for pilot", "Entra ID is the identity provider"],
    antiPatterns: ["Users will understand the UI"],
  },
  {
    label: GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
    detail: "Traits the architecture must support — not performance numbers.",
    examples: ["HTTPS ingress", "Managed relational database", "Centralized audit logging"],
    antiPatterns: ["Fast", "Highly available"],
  },
  {
    label: GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
    detail:
      "Targets for how well the system must perform. Use numbers when you have them; qualitative targets such as defense in depth are also valid.",
    examples: ["RTO 4h", "p95 latency 200ms", "defense in depth"],
    antiPatterns: ["Good performance", "Fast", "Better UX"],
  },
] as const;

export const STRUCTURED_BRIEF_HELP_HOW_TO_READ_STEPS = [
  "Name the system and write the architecture overview and business outcome — add people and systems manually or suggest them from the overview.",
  "Run Suggest from overview on the structured brief. If it queues, open In progress in the header to follow the request — you can leave this page and return from that list. Confirm each constraint, assumption, and capability you want review engines to treat as fact.",
  "Add quality attributes — numeric when measurable, qualitative when a number does not apply.",
  "Confirm in-scope understanding, save the architecture draft, then use Start architecture review when readiness checks pass.",
] as const;

export const STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID = "help-structured-brief-claim-discipline-heading" as const;

export const STRUCTURED_BRIEF_HELP_APPLICABILITY =
  "This guide applies on create architecture and architecture draft edit routes in Architecture product workflows — including structured brief fields, scope confirmation, and review-start readiness." as const;

export const STRUCTURED_BRIEF_HELP_ERROR_RECOVERY_HEADING = "When structured brief save or suggest fails" as const;

export const STRUCTURED_BRIEF_HELP_ERROR_RECOVERY = {
  whatFailed: "Suggest from overview, field save, or architecture draft persistence could not complete.",
  whatIsIntact:
    "Confirmed structured brief rows already saved on the draft remain stored — a failed suggest or save does not discard prior confirmed facts.",
  nextStep:
    "Retry save from the architecture draft, check In progress for queued suggest jobs, then open troubleshooting if the inline error repeats after refresh.",
} as const;

export type StructuredBriefHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const STRUCTURED_BRIEF_HELP_RELATED_TOPICS_HEADING_ID = "help-structured-brief-related-topics" as const;

export const STRUCTURED_BRIEF_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const STRUCTURED_BRIEF_HELP_RELATED_LINKS: readonly StructuredBriefHelpRelatedLink[] = [
  { label: "First architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Architecture drafts", href: inAppHelpHref("architecture-drafts") },
  { label: "Evidence intake", href: inAppHelpHref("evidence-intake") },
] as const;

export const STRUCTURED_BRIEF_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "structured-brief-overview", title: "Overview" },
  { level: 2, id: CREATE_ARCHITECTURE_HELP_DRAFT_VS_REVIEW_HEADING_ID, title: CREATE_ARCHITECTURE_HELP_DRAFT_VS_REVIEW_HEADING },
  { level: 2, id: CREATE_ARCHITECTURE_HELP_READINESS_CHECKLIST_HEADING_ID, title: CREATE_ARCHITECTURE_HELP_READINESS_CHECKLIST_HEADING },
  { level: 2, id: CREATE_ARCHITECTURE_HELP_FIELD_TIPS_HEADING_ID, title: CREATE_ARCHITECTURE_HELP_FIELD_TIPS_HEADING },
  { level: 2, id: CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_HEADING_ID, title: CREATE_ARCHITECTURE_HELP_CAPABILITIES_QUALITY_HEADING },
  { level: 2, id: "field-concepts", title: "Structured brief field concepts" },
  { level: 2, id: "step-by-step", title: "Step-by-step" },
  { level: 2, id: STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID, title: STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING },
  { level: 2, id: "help-structured-brief-applicability", title: "Scope and applicability" },
  { level: 2, id: "help-structured-brief-error-recovery", title: STRUCTURED_BRIEF_HELP_ERROR_RECOVERY_HEADING },
  {
    level: 2,
    id: STRUCTURED_BRIEF_HELP_RELATED_TOPICS_HEADING_ID,
    title: STRUCTURED_BRIEF_HELP_RELATED_TOPICS_HEADING,
  },
] as const;
