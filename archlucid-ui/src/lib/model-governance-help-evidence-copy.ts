import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH,
  MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_SETTINGS_SOURCES,
  MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO,
} from "@/lib/model-governance-settings-evidence-copy";

export const MODEL_GOVERNANCE_HELP_CANONICAL_PATH = "/help/model-governance" as const;

export const MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE =
  "This guide explains workspace execution profiles and governed model aliases — it is not a signed-review diligence Sources package.";

export const MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const MODEL_GOVERNANCE_HELP_SOURCES_INTRO = MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO;

export const MODEL_GOVERNANCE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "AI and model governance", href: MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH },
  ...MODEL_GOVERNANCE_SETTINGS_SOURCES,
] as const;

export const MODEL_GOVERNANCE_HELP_OPERATOR_CLAIM = MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE;
