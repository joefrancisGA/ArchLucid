import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_SOURCES,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { AI_USAGE_HELP_CANONICAL_PATH } from "@/lib/ai-usage-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CANONICAL_PATH } from "@/lib/model-governance-help-evidence-copy";

export const ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH = "/help/architecture-intelligence" as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING =
  "What architecture intelligence is not" as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE =
  "This guide explains closed-loop architecture reasoning and publish-to-findings. Descriptions you submit are tenant-scoped to your workspace and retained under your workspace data-retention policy — it is not a signed-review diligence Sources package.";

export const ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO = ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO;

/** Operator Sources — no self-href to architecture-intelligence or tile-covered destinations. */
export const ARCHITECTURE_INTELLIGENCE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  ...ARCHITECTURE_INTELLIGENCE_SOURCES,
  { label: "Model governance help", href: MODEL_GOVERNANCE_HELP_CANONICAL_PATH },
  { label: "AI usage help", href: AI_USAGE_HELP_CANONICAL_PATH },
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_OPERATOR_CLAIM = ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE;
