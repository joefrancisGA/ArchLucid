import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import {
  MODEL_GOVERNANCE_HELP_TOPIC_LABEL,
  MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
} from "@/lib/model-governance-settings-evidence-copy";

export const MODEL_GOVERNANCE_HELP_PAGE_TITLE = "AI and model governance";

export const MODEL_GOVERNANCE_HELP_PAGE_SUBTITLE =
  "Manage the workspace default execution profile and governed model aliases used on reviews.";

export const MODEL_GOVERNANCE_HELP_OVERVIEW =
  "Model governance controls which execution profile and governed model aliases apply to architecture reviews in this workspace. Use it for workspace-wide AI policy — not as a signed-review diligence Sources package.";

export const MODEL_GOVERNANCE_HELP_PRIMARY_ACTION = {
  label: "Open AI and model governance",
  href: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
} as const;

export type ModelGovernanceHelpItem = {
  readonly label: string;
  readonly detail: string;
};

export const MODEL_GOVERNANCE_HELP_FEATURE_ITEMS: readonly ModelGovernanceHelpItem[] = [
  {
    label: "Execution profile",
    detail: "Set or clear a tenant override for the workspace default model execution profile.",
  },
  {
    label: "Governed aliases",
    detail: "Review alias catalog rows published for this workspace after platform configuration.",
  },
  {
    label: "Profile mappings",
    detail: "See how execution profiles map to governed aliases when the catalog is configured.",
  },
  {
    label: "Spend signals",
    detail: "Open AI usage when profile changes need cost monitoring or budget follow-up.",
  },
] as const;

export const MODEL_GOVERNANCE_HELP_HOW_TO_READ_STEPS = [
  "Review the effective execution profile and alias catalog for this workspace.",
  "Apply or clear tenant overrides when workspace-wide model policy needs to change.",
  "Open AI usage or billing help when spend signals need attention after profile changes.",
] as const;

export const MODEL_GOVERNANCE_HELP_AI_USAGE_HREF = "/help/ai-usage";

export const MODEL_GOVERNANCE_HELP_BILLING_HREF = "/help/billing-and-plans";

export const MODEL_GOVERNANCE_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "what-model-governance-controls", title: "What model governance controls" },
  { level: 2, id: "how-model-governance-works", title: MODEL_GOVERNANCE_HELP_TOPIC_LABEL },
  { level: 2, id: "where-to-go-next", title: "Where to go next" },
];
