import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/structured-brief-help-evidence-copy";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import {
  GUIDED_INTAKE_STRUCTURED_BRIEF_QUALITY_ATTRIBUTES_LABEL,
  GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL,
} from "@/lib/guided-intake-copy";

export const STRUCTURED_BRIEF_HELP_BREADCRUMB_TOPIC_TITLE = "Structured brief fields";

export const STRUCTURED_BRIEF_HELP_PAGE_EYEBROW = "Help topic" as const;

export const STRUCTURED_BRIEF_HELP_PAGE_TITLE = "Structured brief fields";

export const STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE =
  "How to fill constraints, assumptions, required capabilities, and quality attributes before evidence intake.";

export const STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE_BUYER =
  "Plain-language guidance for the structured brief section on create and edit architecture." as const;

export const STRUCTURED_BRIEF_HELP_PRIMARY_CONTENT_ID = "help-structured-brief-primary-content" as const;

export const STRUCTURED_BRIEF_HELP_SKIP_LINK_LABEL = "Skip to structured brief guide" as const;

export function structuredBriefHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE_BUYER
    : STRUCTURED_BRIEF_HELP_PAGE_SUBTITLE;
}

export const STRUCTURED_BRIEF_HELP_OVERVIEW =
  "The structured brief turns free-text architecture intent into confirmed facts review engines can rely on. Suggestions from overview text stay unconfirmed until you add or confirm them.";

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
    detail: "Facts you are treating as true for this draft even if they are not verified yet.",
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
  "Write the architecture overview first — suggestions need enough context to be useful.",
  "Run Suggest from overview. If it queues, open In progress in the header to follow the request — you can leave this page and return from that list. Then confirm each constraint, assumption, and capability you want review engines to treat as fact.",
  "Add quality attributes — numeric when measurable, qualitative when a number does not apply.",
  "Save the draft, then open Start a review when the readiness message clears.",
] as const;

export const STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID = "help-structured-brief-claim-discipline-heading" as const;

export const STRUCTURED_BRIEF_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "structured-brief-overview", title: "Overview" },
  { level: 2, id: "field-concepts", title: "Field concepts" },
  { level: 2, id: "step-by-step", title: "Step-by-step" },
  { level: 2, id: STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID, title: STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING },
] as const;
