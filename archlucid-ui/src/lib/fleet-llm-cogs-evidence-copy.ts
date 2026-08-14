import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { INTERNAL_FLEET_LLM_COGS_PATH } from "@/lib/internal-ops-route-paths";

export const FLEET_LLM_COGS_CANONICAL_PATH = INTERNAL_FLEET_LLM_COGS_PATH;

export const FLEET_LLM_COGS_HELP_TOPIC_LABEL = "How fleet LLM COGS works" as const;

export const FLEET_LLM_COGS_CLAIM_DISCIPLINE_HEADING = "What this page does not cover";

export const FLEET_LLM_COGS_FOLLOW_UPS_TITLE = "Where to go next";

export const FLEET_LLM_COGS_CLAIM_HEADING_ID = "fleet-llm-cogs-claim-discipline-heading" as const;

export const FLEET_LLM_COGS_CLAIM_DISCIPLINE =
  "Fleet LLM COGS summarizes internal UTC-month LLM pressure, budget-cap utilization, and gross-margin risk labels — they are operational cost estimates, not Azure invoice totals, customer charges, or a sealed-review diligence Sources package.";

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
