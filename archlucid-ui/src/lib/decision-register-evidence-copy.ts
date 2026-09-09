import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_DECISION_REGISTER_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const DECISION_REGISTER_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const DECISION_REGISTER_CLAIM_DISCIPLINE =
  "This register lists architecture decisions locked with finalized review records in the current workspace — each row links to the review, findings, and lineage that justified the recorded decision. It does not replace findings triage or official assurance materials.";

export const DECISION_REGISTER_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "a recorded decision needs review-package, findings, or audit follow-up",
);

/** Operator Sources — no self-href to decision-register. */
export const DECISION_REGISTER_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Architecture reviews",
    href: "/architecture/reviews",
    when: "Open the review that produced the finalized record behind a decision",
  },
  {
    label: "Findings",
    href: GOVERNANCE_FINDINGS_PATH,
    when: "Triage live risks when a decision needs resolve follow-up",
  },
  {
    label: "Finalized review records",
    href: SIGNED_RECORDS_LIST_PATH,
    when: "Inspect the finalized package that locked each recorded decision",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow activity records when you need audit context for procurement",
  },
  {
    label: "Approval help",
    href: inAppHelpHref("governance-approval"),
    when: "Read resolve workflow orientation before approving changes",
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Product orientation for architects new to finalized review records",
  },
] as const;

const DECISION_REGISTER_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([GOVERNANCE_DECISION_REGISTER_PATH]);

/** Operator orientation Sources — excludes self-href to `/governance/decision-register` (GDO). */
export const DECISION_REGISTER_ORIENTATION_SOURCES: readonly EvidenceSourceLinkWithWhen[] =
  DECISION_REGISTER_SOURCES.filter(
    (source) => !DECISION_REGISTER_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
  );

export const DECISION_REGISTER_CANONICAL_PATH = GOVERNANCE_DECISION_REGISTER_PATH;
