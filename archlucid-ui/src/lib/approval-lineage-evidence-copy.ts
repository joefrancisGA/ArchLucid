import { GOVERNANCE_APPROVAL_QUEUE_PATH, GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

/** Workbook path pattern for GAI (dynamic approval id). */
export const APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN =
  "/governance/approval-requests/[id]/lineage" as const;

export const APPROVAL_LINEAGE_HELP_TOPIC_LABEL = "How approval lineage works";

export const APPROVAL_LINEAGE_PRIMARY_CONTENT_ID = "approval-lineage-primary-content" as const;

export const APPROVAL_LINEAGE_SKIP_LINK_LABEL = "Skip to approval lineage" as const;

export const APPROVAL_LINEAGE_FOLLOW_UPS_TITLE = "Where to go next";

export const APPROVAL_LINEAGE_CLAIM_DISCIPLINE =
  "Approval lineage shows how one approval request connects to its review, findings, and finalized review record version. Use it to inspect links — not as a full audit export on its own. Open Audit or the architecture review when you need the fuller trail.";

export const APPROVAL_LINEAGE_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "lineage turns into queue context, findings triage, or audit trail",
);

export const APPROVAL_LINEAGE_PAGE_LEAD =
  "Follow how one approval request links to its review, findings, and finalized review record version.";

export const APPROVAL_LINEAGE_START_HERE_CARD_TITLE = "Start here" as const;

export const APPROVAL_LINEAGE_BUYER_START_HERE_HELPER =
  "Read the lineage spine, then open Approval queue, Findings, or Audit when you need queue context or a fuller trail.";

export const APPROVAL_LINEAGE_FIRST_VIEWPORT_TEST_ID = "approval-lineage-first-viewport" as const;


/** Operator Sources — no self-href to the dynamic lineage route pattern. */
export const APPROVAL_LINEAGE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Approval queue", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;
