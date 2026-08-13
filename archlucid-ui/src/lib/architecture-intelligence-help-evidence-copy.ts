import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_SOURCES,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";

export const ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH = "/help/architecture-intelligence" as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE =
  "This guide explains closed-loop architecture reasoning and publish-to-findings — it is not a signed-review diligence Sources package.";

export const ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO = ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO;

export const ARCHITECTURE_INTELLIGENCE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Architecture intelligence", href: ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH },
  ...ARCHITECTURE_INTELLIGENCE_SOURCES,
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_OPERATOR_CLAIM = ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE;
