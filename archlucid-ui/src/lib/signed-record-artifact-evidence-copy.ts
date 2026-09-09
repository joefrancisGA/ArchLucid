import {
  HUB_SECONDARY_FOLLOW_UPS_TITLES,
  hubSecondaryFollowUpsIntro,
} from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH } from "@/lib/ui-route-traffic-signed-record-artifact-preview";

export const SIGNED_RECORD_ARTIFACT_CANONICAL_PATH_PATTERN = SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH;

export const SIGNED_RECORD_ARTIFACT_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.governanceFindings;

export const SIGNED_RECORD_ARTIFACT_CLAIM_DISCIPLINE =
  "This artifact preview shows one deliverable from a finalized review record — not a full audit export on its own. Open the finalized review record, Findings, or Audit for broader context.";

export const SIGNED_RECORD_ARTIFACT_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "this deliverable preview needs package context, findings triage, or audit follow-up",
);

/** Operator Sources — no self-href to the dynamic artifact preview path. */
export const SIGNED_RECORD_ARTIFACT_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Finalized review records", href: SIGNED_RECORDS_LIST_PATH },
  { label: "Reviews help guide", href: inAppHelpHref("review-packages") },
  { label: "Findings", href: GOVERNANCE_FINDINGS_PATH },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

const SIGNED_RECORD_ARTIFACT_DETAIL_PATH_PREFIX = `${SIGNED_RECORDS_LIST_PATH}/` as const;

/** Operator orientation Sources — excludes self-href to artifact preview routes (GAR). */
export const SIGNED_RECORD_ARTIFACT_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] =
  SIGNED_RECORD_ARTIFACT_SOURCES.filter(
    (source) => !source.href.startsWith(`${SIGNED_RECORD_ARTIFACT_DETAIL_PATH_PREFIX}`),
  );
