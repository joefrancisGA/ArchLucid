import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import {
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_DECISION_REGISTER_PATH,
  GOVERNANCE_EXCEPTIONS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const RISK_EXCEPTIONS_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const RISK_EXCEPTIONS_CANONICAL_PATH = GOVERNANCE_EXCEPTIONS_PATH;

export const RISK_EXCEPTIONS_HELP_TOPIC_LABEL = "How risk exceptions work";

export const RISK_EXCEPTIONS_CLAIM_DISCIPLINE =
  "Risk exceptions track temporary approvals to accept a known risk for accepted findings — they are not a full audit export on their own. Open Findings, Audit, or a review workspace when you need export-ready records for leadership or audit.";

export const RISK_EXCEPTIONS_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "a waiver needs finding triage, review-package context, or audit follow-up",
);


/** Operator Sources — no self-href to exceptions. */
export const RISK_EXCEPTIONS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Decision register", href: GOVERNANCE_DECISION_REGISTER_PATH },
  { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
  { label: "Findings help", href: inAppHelpHref("findings") },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
] as const;

const RISK_EXCEPTIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([GOVERNANCE_EXCEPTIONS_PATH]);

/** Operator orientation Sources — excludes self-href to `/governance/exceptions` (GRO). */
export const RISK_EXCEPTIONS_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = RISK_EXCEPTIONS_SOURCES.filter(
  (source) => !RISK_EXCEPTIONS_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
