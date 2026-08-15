import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { AI_USAGE_HELP_CANONICAL_PATH } from "@/lib/ai-usage-help-evidence-copy";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO } from "@/lib/model-governance-settings-evidence-copy";
import { SUBPROCESSORS_HELP_CANONICAL_PATH } from "@/lib/subprocessors-help-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const MODEL_GOVERNANCE_HELP_CANONICAL_PATH = "/help/model-governance" as const;

export const MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING = "What model governance is not";

export const MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace execution profiles and governed model aliases — it is not a sealed-review diligence Sources package.";

export const MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const MODEL_GOVERNANCE_HELP_SOURCES_INTRO = MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO;

/** Help follow-ups — no self-href to administration model governance; distinct help vs admin labels. */
export const MODEL_GOVERNANCE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Subprocessors register", href: SUBPROCESSORS_HELP_CANONICAL_PATH },
  { label: "Data handling help", href: DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH },
  { label: "AI usage settings", href: "/administration/ai-usage" },
  { label: "AI usage help", href: AI_USAGE_HELP_CANONICAL_PATH },
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
