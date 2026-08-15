import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  STANDARDS_RULES_CLAIM_DISCIPLINE,
  STANDARDS_RULES_CLAIM_DISCIPLINE_HEADING,
  STANDARDS_RULES_SOURCES_INTRO,
} from "@/lib/standards-rules-evidence-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const STANDARDS_RULES_HELP_CANONICAL_PATH = "/help/standards-and-rules" as const;

export const STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING = STANDARDS_RULES_CLAIM_DISCIPLINE_HEADING;

export const STANDARDS_RULES_HELP_CLAIM_DISCIPLINE = STANDARDS_RULES_CLAIM_DISCIPLINE;

export const STANDARDS_RULES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const STANDARDS_RULES_HELP_SOURCES_INTRO = STANDARDS_RULES_SOURCES_INTRO;

/** Help follow-ups — no self-href; policy packs help only (governance path lives on the definition tile). */
export const STANDARDS_RULES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Standards & rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Sealed review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
