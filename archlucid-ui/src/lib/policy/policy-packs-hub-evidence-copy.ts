import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH, GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const POLICY_PACKS_HUB_CANONICAL_PATH = GOVERNANCE_POLICY_PACKS_PATH;

export const POLICY_PACKS_HUB_HELP_TOPIC_LABEL = "How policy packs work" as const;

export const POLICY_PACKS_HUB_CLAIM_DISCIPLINE =
 "The policy pack library lists your policy packs and authoring tools — not a full audit export. Open Standards & rules or Findings to see rules in use.";

export const POLICY_PACKS_HUB_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.policyPacksHub;

export const POLICY_PACKS_HUB_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "pack library questions turn into applied rules, findings, or assurance orientation",
);


/** Operator Sources — no self-href to /governance/policy-packs hub. */
export const POLICY_PACKS_HUB_SOURCES: readonly EvidenceSourceLink[] = [
 { label: "Standards & rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
 { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
 { label: "Architecture reviews", href: "/architecture/reviews" },
 { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
 { label: "Assurance status", href: "/assurance-status" },
] as const;

const POLICY_PACKS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([POLICY_PACKS_HUB_CANONICAL_PATH]);

/** Operator orientation Sources — excludes self-href to `/governance/policy-packs` (GPP). */
export const POLICY_PACKS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = POLICY_PACKS_HUB_SOURCES.filter(
  (source) => !POLICY_PACKS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
