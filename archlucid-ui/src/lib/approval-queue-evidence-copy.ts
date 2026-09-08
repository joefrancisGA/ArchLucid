import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_AUDIT_PATH,
  GOVERNANCE_FINDINGS_PATH,
  GOVERNANCE_WORKSPACE_HEALTH_HREF,
} from "@/lib/governance/governance-route-paths";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const APPROVAL_QUEUE_CLAIM_DISCIPLINE =
  "This approval queue records submit / approve / reject decisions for architecture reviews in the current workspace — workflow only, not a full audit export. Open Audit or the linked review for the complete record.";

export const APPROVAL_QUEUE_FOLLOW_UPS_TITLE = "Where to go next";

export const APPROVAL_QUEUE_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "approval workflow turns into findings triage, audit trail, or workspace health",
);


/** Operator Sources — no self-href to the approval queue. */
export const APPROVAL_QUEUE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Workspace health", href: GOVERNANCE_WORKSPACE_HEALTH_HREF },
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started") },
] as const;

export const APPROVAL_QUEUE_CANONICAL_PATH = GOVERNANCE_APPROVAL_QUEUE_PATH;

export const GOVERNANCE_APPROVAL_QUEUE_PRIMARY_CONTENT_ID = "governance-approval-queue-primary-content" as const;

export const GOVERNANCE_APPROVAL_QUEUE_SKIP_LINK_LABEL = "Skip to approval workflow" as const;

export const GOVERNANCE_APPROVAL_QUEUE_FIRST_VIEWPORT_TEST_ID = "governance-approval-queue-first-viewport" as const;

export const GOVERNANCE_APPROVAL_QUEUE_PAGE_LEAD =
  "Track pending approvals and submit reviews for governance decisions in this workspace.";

export const GOVERNANCE_APPROVAL_QUEUE_START_HERE_CARD_TITLE = "Start here" as const;

export const GOVERNANCE_APPROVAL_QUEUE_BUYER_START_HERE_HELPER =
  "Pick a review, confirm readiness, then submit or approve from the workflow below when findings and evidence are in place.";

export const APPROVAL_QUEUE_HELP_TOPIC_LABEL = "How the approval queue works";
