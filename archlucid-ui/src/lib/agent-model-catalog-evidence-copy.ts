import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { INTERNAL_AGENT_MODEL_CATALOG_PATH, INTERNAL_FLEET_LLM_COGS_PATH } from "@/lib/internal-ops-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const AGENT_MODEL_CATALOG_CANONICAL_PATH = INTERNAL_AGENT_MODEL_CATALOG_PATH;

export const AGENT_MODEL_CATALOG_HELP_TOPIC_LABEL = "How the agent model catalog works" as const;

export const AGENT_MODEL_CATALOG_FOLLOW_UPS_TITLE = "Where to go next";

export const AGENT_MODEL_CATALOG_SOURCES_INTRO =
  "Use these follow-ups when alias lifecycle, evaluation evidence, or faithfulness harness imports need spend, governance, or operational context.";

/** Operator Sources — no self-href to `/internal/agent-model-catalog`. */
export const AGENT_MODEL_CATALOG_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Fleet LLM COGS", href: INTERNAL_FLEET_LLM_COGS_PATH },
  { label: "Model governance", href: "/administration/model-governance" },
  { label: "AI usage", href: "/administration/ai-usage" },
  { label: "Model governance help", href: inAppHelpHref("model-governance") },
  { label: "System health", href: "/administration/system-health" },
] as const;
