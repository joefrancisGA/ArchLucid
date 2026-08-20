import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_SOURCES,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { AI_USAGE_HELP_CANONICAL_PATH } from "@/lib/ai-usage-help-evidence-copy";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CANONICAL_PATH } from "@/lib/model-governance-help-evidence-copy";

export const ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH = "/help/architecture-intelligence" as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING =
  "What architecture intelligence is not" as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_CLAUSE =
  "Descriptions you submit are tenant-scoped to your workspace and retained under your workspace data-retention policy.";

export const ARCHITECTURE_INTELLIGENCE_HELP_DATA_HANDLING_LINK = {
  label: "Data handling help",
  href: DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH,
} as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE =
  "This guide explains closed-loop architecture reasoning and publish-to-findings — not a full audit export.";

export const ARCHITECTURE_INTELLIGENCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ARCHITECTURE_INTELLIGENCE_HELP_SOURCES_INTRO = ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO;

/** Operator Sources — no self-href to architecture-intelligence or tile-covered destinations. */
export const ARCHITECTURE_INTELLIGENCE_HELP_SOURCES: readonly EvidenceOrientationLink[] = [
  ...ARCHITECTURE_INTELLIGENCE_SOURCES,
  {
    label: "Model governance help",
    href: MODEL_GOVERNANCE_HELP_CANONICAL_PATH,
    when: "Review workspace execution profiles and governed aliases before changing model policy",
  },
  {
    label: "AI usage help",
    href: AI_USAGE_HELP_CANONICAL_PATH,
    when: "Monitor estimated AI spend when reasoning runs add model activity",
  },
] as const;

export const ARCHITECTURE_INTELLIGENCE_HELP_OPERATOR_CLAIM = ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE;
