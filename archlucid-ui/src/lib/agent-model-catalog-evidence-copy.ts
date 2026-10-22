import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_AGENT_MODEL_CATALOG_PATH, INTERNAL_FLEET_LLM_COGS_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AGENT_MODEL_CATALOG_CANONICAL_PATH = INTERNAL_AGENT_MODEL_CATALOG_PATH;

export const AGENT_MODEL_CATALOG_PRIMARY_CONTENT_ID = "agent-model-catalog-primary-content" as const;

export const AGENT_MODEL_CATALOG_SKIP_LINK_LABEL = "Skip to agent model catalog" as const;

export const AGENT_MODEL_CATALOG_CLAIM_DISCIPLINE =
  "Catalog rows describe platform alias lifecycle and evaluation evidence — not tenant-facing deployment names or sealed review exports." as const;

export const AGENT_MODEL_CATALOG_HELP_TOPIC_LABEL = "How the agent model catalog works" as const;

export const AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE = "Where to go next";

export const AGENT_MODEL_CATALOG_SOURCES_INTRO =
  "Use these follow-ups when alias lifecycle, evaluation evidence, or faithfulness harness imports need spend, governance, or operational context.";

/** Operator Sources — no self-href to `/internal/agent-model-catalog`. */
export const AGENT_MODEL_CATALOG_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Fleet LLM COGS", href: INTERNAL_FLEET_LLM_COGS_PATH },
  { label: "Model policy", href: "/administration/model-governance" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Model policy help", href: inAppHelpHref("model-governance") },
  { label: "System health", href: "/administration/system-health" },
] as const;
