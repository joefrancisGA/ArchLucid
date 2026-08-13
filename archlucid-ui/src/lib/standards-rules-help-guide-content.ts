import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  STANDARDS_RULES_PAGE_SUBTITLE,
  STANDARDS_RULES_PAGE_TITLE,
  STANDARDS_RULES_HELP_TOPIC_LABEL,
  STANDARDS_RULES_VIEW_EXPLANATION_NEXT_ACTION,
  STANDARDS_RULES_VIEW_EXPLANATION_SUMMARY,
} from "@/lib/standards-rules-page";

export const STANDARDS_RULES_HELP_PAGE_TITLE = STANDARDS_RULES_PAGE_TITLE;

export const STANDARDS_RULES_HELP_PAGE_SUBTITLE = STANDARDS_RULES_PAGE_SUBTITLE;

export const STANDARDS_RULES_HELP_OVERVIEW = STANDARDS_RULES_VIEW_EXPLANATION_SUMMARY;

export const STANDARDS_RULES_HELP_PRIMARY_ACTION = {
  label: "Open standards & rules",
  href: "/governance/standards-and-rules",
} as const;

export type StandardsRulesHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const STANDARDS_RULES_HELP_TABLE_ITEMS: readonly StandardsRulesHelpItem[] = [
  {
    label: "Enforced rules",
    detail: "Rows show standards, policy checks, enforcement mode, and the source policy pack.",
  },
  {
    label: "Linked evidence",
    detail: "Open findings or the evidence trail when a rule needs disposition or sponsor context.",
  },
  {
    label: "Resolution snapshot",
    detail: "Export a diagnostic report when you need a citeable point-in-time resolution record.",
  },
  {
    label: "Policy packs",
    detail: "Author or compare packs when resolution questions turn into pack maintenance.",
  },
] as const;

export const STANDARDS_RULES_HELP_HOW_TO_READ_STEPS = [
  STANDARDS_RULES_VIEW_EXPLANATION_NEXT_ACTION,
  "Filter or refresh the table when scope changes or new packs apply to the review.",
  "Open policy packs or findings when a rule row needs follow-up outside this resolution view.",
] as const;

export const STANDARDS_RULES_HELP_POLICY_PACKS_HREF = GOVERNANCE_POLICY_PACKS_PATH;

export const STANDARDS_RULES_HELP_FINDINGS_HREF = GOVERNANCE_FINDINGS_PATH;

export const STANDARDS_RULES_HELP_POLICY_PACKS_HELP_HREF = inAppHelpHref("policy-packs");

export const STANDARDS_RULES_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-standards-and-rules-shows", title: "What standards & rules shows" },
  { level: 2, id: "how-to-read-standards-and-rules", title: STANDARDS_RULES_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
