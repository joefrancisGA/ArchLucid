import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const POLICY_PACKS_HUB_CLAIM_DISCIPLINE =
 "The policy pack library lists workspace packs, catalog clones, and authoring tools — it is not a signed-review diligence Sources package. Open Standards & rules or Findings when you need applied-rule or finding trails.";

export const POLICY_PACKS_HUB_SOURCES_INTRO =
 "Use these follow-ups when pack library questions turn into applied rules, findings, or assurance orientation.";


/** Operator Sources — no self-href to /governance/policy-packs hub. */
export const POLICY_PACKS_HUB_SOURCES: readonly EvidenceSourceLink[] = [
 { label: "Standards & rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
 { label: "Findings", href: "/governance/findings" },
 { label: "Architecture reviews", href: "/architecture/reviews" },
 { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
 { label: "Assurance status", href: "/security-trust" },
] as const;
