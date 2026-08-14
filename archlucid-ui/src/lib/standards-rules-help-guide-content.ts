import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  STANDARDS_RULES_HELP_TOPIC_LABEL,
  STANDARDS_RULES_VIEW_EXPLANATION_NEXT_ACTION,
  STANDARDS_RULES_VIEW_EXPLANATION_SUMMARY,
} from "@/lib/standards-rules-page";
import { STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING } from "@/lib/standards-rules-help-evidence-copy";

export const STANDARDS_RULES_HELP_BREADCRUMB_TOPIC_TITLE = "Standards & rules";

export const STANDARDS_RULES_HELP_PAGE_TITLE = "Standards & rules";

export const STANDARDS_RULES_HELP_PAGE_SUBTITLE =
  "How to read enforced rules, policy pack sources, and linked evidence on the standards and rules resolution view.";

export const STANDARDS_RULES_HELP_OVERVIEW = STANDARDS_RULES_VIEW_EXPLANATION_SUMMARY;

export const STANDARDS_RULES_HELP_START_HERE_CARD_TITLE = "Start here";

export const STANDARDS_RULES_HELP_PRIMARY_ACTION = {
  label: "Open standards & rules",
  href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
} as const;

export type StandardsRulesHelpItem = {
  readonly label: string;
  readonly detail: string;
  readonly href?: string;
};

export const STANDARDS_RULES_HELP_TABLE_ITEMS: readonly StandardsRulesHelpItem[] = [
  {
    label: "Enforced rules",
    detail: "Rows show standards, policy checks, enforcement mode, and the source policy pack.",
  },
  {
    label: "Linked evidence",
    detail: "Open findings or the evidence trail when a rule needs disposition or sponsor context.",
    href: GOVERNANCE_FINDINGS_PATH,
  },
  {
    label: "Resolution snapshot",
    detail: "Export a diagnostic report when you need a citeable point-in-time resolution record.",
  },
  {
    label: "Policy packs",
    detail: "Author or compare packs when resolution questions turn into pack maintenance.",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
] as const;

export const STANDARDS_RULES_HELP_HOW_TO_READ_STEPS = [
  STANDARDS_RULES_VIEW_EXPLANATION_NEXT_ACTION,
  "Filter or refresh the table when scope changes or new packs apply to the review.",
  "Open policy packs or findings when a rule row needs follow-up outside this resolution view.",
] as const;

export const STANDARDS_RULES_HELP_FINDINGS_HREF = GOVERNANCE_FINDINGS_PATH;

export const STANDARDS_RULES_HELP_POLICY_PACKS_HELP_HREF = inAppHelpHref("policy-packs");

export const STANDARDS_RULES_HELP_CLAIM_HEADING_ID = "help-standards-rules-claim-discipline-heading" as const;

export const STANDARDS_RULES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-standards-and-rules-shows", title: "What standards & rules shows" },
  { level: 2, id: "how-to-read-standards-and-rules", title: STANDARDS_RULES_HELP_TOPIC_LABEL },
  {
    level: 2,
    id: STANDARDS_RULES_HELP_CLAIM_HEADING_ID,
    title: STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING,
  },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
