import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** Alias kept for call sites that name the signed-record Sources row type explicitly. */
export type SignedRecordSourceLink = EvidenceSourceLink;

/** Workbook path pattern for MMX (dynamic manifest id). */
export const SIGNED_RECORD_CANONICAL_PATH_PATTERN = "/governance/sealed-records/[manifestId]" as const;

export const SIGNED_RECORD_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const SIGNED_RECORD_CLAIM_DISCIPLINE =
  "This finalized review record packages decisions, findings, and downloadable artifacts for one finalized review — one review's export bundle. Open Audit or Assurance status for broader official materials.";

export const SIGNED_RECORD_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "this finalized package needs findings triage, audit trail, or official assurance materials",
);

/** Operator Sources — no self-href to the dynamic signed-record detail path. */
export const SIGNED_RECORD_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Finalized review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Reviews help guide", href: inAppHelpHref("review-packages") },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

const SIGNED_RECORD_DETAIL_PATH_PREFIX = `${SIGNED_RECORDS_LIST_PATH}/` as const;

/** Operator orientation Sources — excludes self-href to `/governance/sealed-records/[manifestId]` (MMX). */
export const SIGNED_RECORD_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = SIGNED_RECORD_SOURCES.filter(
  (source) => !source.href.startsWith(SIGNED_RECORD_DETAIL_PATH_PREFIX),
);
