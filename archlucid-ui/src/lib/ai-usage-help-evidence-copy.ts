import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  AI_USAGE_SETTINGS_CANONICAL_PATH,
  AI_USAGE_SETTINGS_CLAIM_DISCIPLINE,
  AI_USAGE_SETTINGS_SOURCES,
  AI_USAGE_SETTINGS_SOURCES_INTRO,
} from "@/lib/ai-usage-settings-evidence-copy";

export const AI_USAGE_HELP_CANONICAL_PATH = "/help/ai-usage" as const;

export const AI_USAGE_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace AI usage and cost signals — it is not invoice-accurate financial reporting or a signed-review diligence Sources package.";

export const AI_USAGE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const AI_USAGE_HELP_SOURCES_INTRO = AI_USAGE_SETTINGS_SOURCES_INTRO;

export const AI_USAGE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "AI usage", href: AI_USAGE_SETTINGS_CANONICAL_PATH },
  { label: "Billing and plans", href: "/administration/billing" },
  { label: "Billing and plans help", href: "/help/billing-and-plans" },
  { label: "Model governance", href: "/administration/model-governance" },
  { label: "Audit", href: "/governance/audit" },
] as const;

export const AI_USAGE_HELP_OPERATOR_CLAIM = AI_USAGE_SETTINGS_CLAIM_DISCIPLINE;
