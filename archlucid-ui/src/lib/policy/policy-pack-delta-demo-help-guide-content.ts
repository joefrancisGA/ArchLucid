import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_POLICY_PACKS_PATH,
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const POLICY_PACK_DELTA_DEMO_HELP_PAGE_TITLE = "Policy-pack delta demo";

export const POLICY_PACK_DELTA_DEMO_HELP_PAGE_SUBTITLE =
  "SE/Admin runbook: same finalized review, stricter pack enforcement, different finalize-gate outcome — dry-run, simulation, and audit slice. Not buyer self-serve help.";

export const POLICY_PACK_DELTA_DEMO_HELP_OVERVIEW =
  "Use this script when a prospect asks why policy packs matter. Show the same architecture package under a looser then stricter enforcement posture, prove the delta with dry-run/simulation, then open the audit trail. Buyers evaluating day-to-day governance should use Governance approval and Alerts help instead.";

export const POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE =
  "Dry-run and simulation output is architecture-review governance evidence, not certification.";

export const POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC = [
  "Same review, default posture — bundled packs at the pilot priority floor.",
  "Tighten enforcement — block on critical or lower the minimum severity.",
  "Dry-run the delta — show would-block without mutating the run.",
  "Audit proof — export or open the audit trail for simulation / dry-run events.",
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_PRIMARY_ACTIONS = {
  openPolicyPacks: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  openStandardsAndRules: {
    label: "Standards and rules",
    href: GOVERNANCE_STANDARDS_AND_RULES_PATH,
  },
  openAuditTrail: {
    label: "Open audit trail",
    href: GOVERNANCE_AUDIT_PATH,
  },
} as const;

export type PolicyPackDeltaDemoHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Sponsor-safe / SE diligence Sources — no self-href to this topic. */
export const POLICY_PACK_DELTA_DEMO_HELP_SOURCES: readonly PolicyPackDeltaDemoHelpSourceLink[] = [
  { label: "Policy packs", href: GOVERNANCE_POLICY_PACKS_PATH },
  { label: "Standards and rules", href: GOVERNANCE_STANDARDS_AND_RULES_PATH },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Understanding alerts", href: inAppHelpHref("alerts") },
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_CANONICAL_PATH = POLICY_PACK_DELTA_DEMO_HELP_PATH;
