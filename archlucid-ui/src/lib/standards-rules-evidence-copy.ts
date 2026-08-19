import { GOVERNANCE_FINDINGS_PATH, GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const STANDARDS_RULES_CLAIM_DISCIPLINE_HEADING = "What standards & rules is not";

export const STANDARDS_RULES_CLAIM_DISCIPLINE =
  "Standards & rules shows effective policy resolution and applied rule rows for the current scope — not a sealed review record on its own. Export a diagnostic report when you need a point-in-time citeable snapshot, then open Findings or Policy packs for follow-up.";

export const STANDARDS_RULES_SOURCES_INTRO =
  "Use these follow-ups when resolution questions turn into pack authoring, findings, or assurance orientation.";


/** Operator Sources — no self-href to /governance/standards-and-rules. */
export const STANDARDS_RULES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
