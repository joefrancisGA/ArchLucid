import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { HELP_HUB_CANONICAL_PATH, HELP_TOPIC_BREADCRUMB_HUB_LABEL } from "@/lib/help/help-hub-evidence-copy";
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
  "Use this script when a prospect asks why policy packs matter. Show the same architecture package under a looser then stricter enforcement posture, prove the delta with dry-run/simulation, then open the audit trail. Buyers evaluating day-to-day approval should use Approval and Alerts help instead.";

export const POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE =
  "Dry-run and simulation output is architecture-review approval evidence, not certification.";

export const POLICY_PACK_DELTA_DEMO_HELP_NARRATIVE_ARC = [
  "Same review, default posture — bundled packs at the pilot priority floor.",
  "Tighten enforcement — block on critical or lower the minimum severity.",
  "Dry-run the delta — show would-block without mutating the run.",
  "Audit proof — export or open the audit trail for simulation / dry-run events.",
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_TITLE =
  "Finding-set toggle (compliance + declaration + extras)";

export const POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_SUMMARY =
  "Same architecture, different assigned packs change which compliance and declaration findings fire — not only pre-finalize gate floors. Overlay extras (FinOps cost.requireBudgetCap, CIS identity topology) change coverage and cost rows when bundled JSON includes the keys.";

export const POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_OFFLINE_TESTS = [
  "PolicyFilteredGoldenCorpusTests",
  "PolicyFilteredDeclarationGoldenCorpusTests",
  "PolicyPackP1ToggleGoldenCorpusTests",
  "PolicyExpectationCoverageGoldenCorpusTests",
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_SCREENSHOT_CHECKLIST = [
  "Findings list (SOC 2 assignment vs CIS Azure assignment)",
  "Severity column",
  "Pre-finalize / dry-run verdict",
  "Audit FindingsSnapshotSealed or policy assignment rows",
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_HONESTY =
  "SOC 2 assignment alone does not add topology identity unless that pack's advisoryDefaults includes expectation.topologyCategories.add=identity. Use a P1 arm for honest SOC 2 vs CIS Azure declaration comparison.";

export const POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_TITLE = "In-app Pack A vs Pack B impact preview";

export const POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_SUMMARY =
  "On Policy packs (My packs tab), pick a committed review, then use the Pack A and Pack B selectors in the policy impact preview panel. Run simulate to show rule-key deltas and would-block gate outcomes side by side — the same dry-run posture as this runbook without mutating the review.";

export const POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_DEEP_LINK =
  "From Compare two reviews, open Policy pack diff → Open pack impact preview for this comparison to pre-fill reviewId and baseline/target pack ids when at-commit snapshots exist.";

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
  { label: "Approval", href: inAppHelpHref("governance-approval") },
  { label: "Understanding alerts", href: inAppHelpHref("alerts") },
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_TOPIC_LABEL = "Policy-pack delta demo" as const;

export const POLICY_PACK_DELTA_DEMO_HELP_APPLICABILITY_SECURENOW =
  "SecureNow (Security) buyers should use governance approval and alerts help — this internal SE/Admin runbook targets Architecture policy-pack enforcement demos only." as const;

export const POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY_HEADING = "When dry-run or simulation fails" as const;

export const POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY = {
  whatFailed: "Dry-run, simulation, or audit export could not complete for the selected review and pack assignment.",
  whatIsIntact:
    "The committed review findings snapshot and existing pack assignments remain unchanged — dry-run does not mutate finalize state.",
  nextStep:
    "Confirm ReadAuthority scope headers, retry simulation from Policy packs, then open the audit trail for the last successful governance event.",
} as const;

export type PolicyPackDeltaDemoHelpRelatedLink = {
  readonly label: string;
  readonly href: string;
};

export const POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING_ID =
  "help-policy-pack-delta-demo-related-topics" as const;

export const POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING = "Related topics" as const;

export const POLICY_PACK_DELTA_DEMO_HELP_RELATED_LINKS: readonly PolicyPackDeltaDemoHelpRelatedLink[] = [
  { label: "Policy packs help", href: inAppHelpHref("policy-packs") },
  { label: "Governance approval", href: inAppHelpHref("governance-approval") },
  { label: "Understanding alerts", href: inAppHelpHref("alerts") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_HELP_RETURN = {
  label: HELP_TOPIC_BREADCRUMB_HUB_LABEL,
  href: HELP_HUB_CANONICAL_PATH,
} as const;

export const POLICY_PACK_DELTA_DEMO_HELP_GUIDE_HEADINGS: readonly HelpMarkdownHeading[] = [
  { level: 2, id: "help-policy-pack-delta-demo-arc-heading", title: "Narrative arc (5 minutes)" },
  {
    level: 2,
    id: "help-policy-pack-delta-demo-impact-preview-heading",
    title: POLICY_PACK_DELTA_DEMO_HELP_IMPACT_PREVIEW_TITLE,
  },
  {
    level: 2,
    id: "help-policy-pack-delta-demo-finding-toggle-heading",
    title: POLICY_PACK_DELTA_DEMO_HELP_FINDING_TOGGLE_TITLE,
  },
  { level: 2, id: "help-policy-pack-delta-demo-action-panel-heading", title: "Run the demo surfaces" },
  { level: 2, id: "help-policy-pack-delta-demo-applicability", title: "Scope and seat applicability" },
  {
    level: 2,
    id: "help-policy-pack-delta-demo-error-recovery",
    title: POLICY_PACK_DELTA_DEMO_HELP_ERROR_RECOVERY_HEADING,
  },
  {
    level: 2,
    id: POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING_ID,
    title: POLICY_PACK_DELTA_DEMO_HELP_RELATED_TOPICS_HEADING,
  },
] as const;

export const POLICY_PACK_DELTA_DEMO_HELP_CANONICAL_PATH = POLICY_PACK_DELTA_DEMO_HELP_PATH;
