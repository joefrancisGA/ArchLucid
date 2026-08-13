import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import {
  STANDARDS_RULES_CLAIM_DISCIPLINE,
  STANDARDS_RULES_SOURCES_INTRO,
} from "@/lib/standards-rules-evidence-copy";

export const STANDARDS_RULES_HELP_CANONICAL_PATH = "/help/standards-and-rules" as const;

export const STANDARDS_RULES_HELP_CLAIM_DISCIPLINE = STANDARDS_RULES_CLAIM_DISCIPLINE;

export const STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const STANDARDS_RULES_HELP_SOURCES_INTRO = STANDARDS_RULES_SOURCES_INTRO;

export const STANDARDS_RULES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Standards & rules", href: "/governance/standards-and-rules" },
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
