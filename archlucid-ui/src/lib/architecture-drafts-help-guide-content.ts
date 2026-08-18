import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  ARCHITECTURE_DRAFTS_CANONICAL_PATH,
} from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/architecture-drafts-help-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_LIST_LABEL,
  CREATE_ARCHITECTURE_LABEL,
} from "@/lib/architecture/architecture-workflow-labels";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";

export const ARCHITECTURE_DRAFTS_HELP_BREADCRUMB_TOPIC_TITLE = "Architecture drafts";

export const ARCHITECTURE_DRAFTS_HELP_PAGE_EYEBROW = "Help topic" as const;

export const ARCHITECTURE_DRAFTS_HELP_PAGE_TITLE = ARCHITECTURE_DRAFTS_LIST_LABEL;

export const ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE =
  "Browse, resume, and refine saved architecture drafts before filing evidence for a governance review.";

export const ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE_BUYER =
  "Saved system briefs you can resume and refine before evidence intake for a governance review." as const;

export const ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID = "help-architecture-drafts-primary-content" as const;

export const ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL = "Skip to architecture drafts guide" as const;

export function architectureDraftsHelpPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE_BUYER
    : ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE;
}

export const ARCHITECTURE_DRAFTS_HELP_HOW_TO_SECTION_TITLE = "Step-by-step" as const;

export const ARCHITECTURE_DRAFTS_HELP_OVERVIEW =
  "Architecture drafts are saved system briefs you can edit before starting evidence intake. Drafting does not start a review — open Start a review when the brief is ready for governance analysis.";

export const ARCHITECTURE_DRAFTS_HELP_PRIMARY_ACTION = {
  label: "Start a review",
  href: REVIEWS_NEW_PATH,
} as const;

export const ARCHITECTURE_DRAFTS_HELP_SECONDARY_ACTION = {
  label: `Open ${ARCHITECTURE_DRAFTS_LIST_LABEL.toLowerCase()}`,
  href: ARCHITECTURE_DRAFTS_CANONICAL_PATH,
} as const;

export type ArchitectureDraftsHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const ARCHITECTURE_DRAFTS_HELP_FEATURE_ITEMS: readonly ArchitectureDraftsHelpItem[] = [
  {
    label: "Draft list",
    detail: "Browse saved drafts for the workspace and project selected in the header switcher.",
  },
  {
    label: "Resume editing",
    detail: "Open a draft to continue refining the brief before evidence intake.",
  },
  {
    label: CREATE_ARCHITECTURE_LABEL,
    detail: "Start a new draft when you need a fresh system brief.",
  },
  {
    label: "Evidence intake",
    detail: "When the brief is ready, open the primary action above to collect evidence for governance analysis.",
  },
] as const;

export const ARCHITECTURE_DRAFTS_HELP_HOW_TO_READ_STEPS = [
  "Open a saved draft or create a new architecture when you need a fresh brief.",
  "Refine draft fields, confirm constraints and assumptions, and save — listing and editing drafts does not start a review.",
  "Open Start a review when the structured brief is ready for evidence intake and governance analysis.",
] as const;

export const ARCHITECTURE_DRAFTS_HELP_FIRST_REVIEW_HREF = "/help/first-architecture-review";

export const ARCHITECTURE_DRAFTS_HELP_CREATE_HREF = "/architecture/architectures/new";

export const ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID = "help-architecture-drafts-claim-discipline-heading" as const;

export const ARCHITECTURE_DRAFTS_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-architecture-drafts-do", title: "What architecture drafts do" },
  { level: 2, id: "how-architecture-drafts-work", title: ARCHITECTURE_DRAFTS_HELP_HOW_TO_SECTION_TITLE },
  {
    level: 2,
    id: ARCHITECTURE_DRAFTS_HELP_CLAIM_HEADING_ID,
    title: ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
