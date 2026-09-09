import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import {
  ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH as ARCHITECTURE_INTELLIGENCE_WORKSPACE_PATH,
  ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_SOURCES,
  ARCHITECTURE_INTELLIGENCE_SOURCES_INTRO,
} from "@/lib/architecture/architecture-intelligence-evidence-copy";
import { AI_USAGE_HELP_CANONICAL_PATH } from "@/lib/ai-usage-help-evidence-copy";
import { DATA_HANDLING_TENANT_ISOLATION_HELP_CANONICAL_PATH } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
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
    label: "Model policy help",
    href: MODEL_GOVERNANCE_HELP_CANONICAL_PATH,
    when: "Review workspace execution profiles and approved model aliases before changing model policy",
  },
  {
    label: "AI usage help",
    href: AI_USAGE_HELP_CANONICAL_PATH,
    when: "Monitor estimated AI spend when reasoning runs add model activity",
  },
] as const;

const ARCHITECTURE_INTELLIGENCE_HELP_EXCLUDED_ORIENTATION_HREFS = new Set<string>([
  ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_WORKSPACE_PATH,
]);

export const ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "reasoning output turns into findings triage, review intake, or official assurance materials",
);

/** Help orientation Sources — excludes self-href and the primary workspace action (EAR). */
export const ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES: readonly EvidenceOrientationLink[] =
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES.filter(
    (source) => !ARCHITECTURE_INTELLIGENCE_HELP_EXCLUDED_ORIENTATION_HREFS.has(source.href),
  );

export const ARCHITECTURE_INTELLIGENCE_HELP_OPERATOR_CLAIM = ARCHITECTURE_INTELLIGENCE_CLAIM_DISCIPLINE;
