import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLinkWithWhen } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_DECISION_REGISTER_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

export const DECISION_REGISTER_CLAIM_DISCIPLINE =
  "This register lists architecture decisions locked with sealed review records in the current workspace — each row links to the review, findings, and lineage that justified the recorded decision. It does not replace findings triage or official assurance materials.";

export const DECISION_REGISTER_SOURCES_INTRO =
  "Open the related architecture review, sealed record, or findings when a decision needs follow-up; use Audit trail for activity context.";

/** Operator Sources — no self-href to decision-register. */
export const DECISION_REGISTER_SOURCES: readonly EvidenceSourceLinkWithWhen[] = [
  {
    label: "Architecture reviews",
    href: "/architecture/reviews",
    when: "Open the review that produced the sealed record behind a decision",
  },
  {
    label: "Findings",
    href: GOVERNANCE_FINDINGS_PATH,
    when: "Triage live risks when a decision needs disposition follow-up",
  },
  {
    label: "Sealed review records",
    href: SIGNED_RECORDS_LIST_PATH,
    when: "Inspect the sealed package that locked each recorded decision",
  },
  {
    label: "Audit trail",
    href: GOVERNANCE_AUDIT_PATH,
    when: "Follow activity records when you need audit context for procurement",
  },
  {
    label: "Governance approval help",
    href: inAppHelpHref("governance-approval"),
    when: "Read disposition workflow orientation before approving changes",
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Product orientation for architects new to sealed review records",
  },
] as const;

export const DECISION_REGISTER_CANONICAL_PATH = GOVERNANCE_DECISION_REGISTER_PATH;
