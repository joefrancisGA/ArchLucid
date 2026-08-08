import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const STANDARDS_RULES_CLAIM_DISCIPLINE =
  "Standards & rules shows effective policy resolution and applied rule rows for the current scope — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Export a diagnostic report when you need a point-in-time citeable snapshot, then open Findings or Policy packs for follow-up.";

export const STANDARDS_RULES_SOURCES_INTRO =
  "Use these follow-ups when resolution questions turn into pack authoring, findings, or assurance orientation.";

export type StandardsRulesSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to /governance/standards-and-rules. */
export const STANDARDS_RULES_SOURCES: readonly StandardsRulesSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Findings", href: "/governance/findings" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
