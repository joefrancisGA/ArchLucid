import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { INTERNAL_FLEET_LLM_COGS_PATH } from "@/lib/internal-ops-route-paths";

export const FLEET_LLM_COGS_CANONICAL_PATH = INTERNAL_FLEET_LLM_COGS_PATH;

export const FLEET_LLM_COGS_HELP_TOPIC_LABEL = "How fleet LLM COGS works" as const;

export const FLEET_LLM_COGS_FOLLOW_UPS_TITLE = "Where to go next";

export const FLEET_LLM_COGS_SOURCES_INTRO =
  "Use these follow-ups when a tenant nears a hard cap, cost rates are missing, or you need billing, usage, or conversion context.";

/** Operator Sources — no self-href to fleet-llm-cogs. */
export const FLEET_LLM_COGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Billing settings", href: "/administration/billing" },
  { label: "Trial funnel", href: "/internal/trial-funnel" },
  { label: "Tenant health", href: "/internal/tenant-health" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
] as const;
