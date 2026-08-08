import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/**
 * Traffic workbook row ID for signed review record detail.
 * Owner backlog shorthand: MMX.
 */
export const SIGNED_RECORD_DETAIL_TRAFFIC_ROW_ID = "MMX";

/** Canonical path pattern tracked on the MMX workbook row. */
export const SIGNED_RECORD_DETAIL_TRAFFIC_PATH = `${SIGNED_RECORDS_LIST_PATH}/[manifestId]` as const;

/** Workbook Section column value (owner catalog). */
export const SIGNED_RECORD_DETAIL_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for MMX - documents Evidence chrome on signed-record detail.
 * ASCII-only for Windows console note scripts.
 */
export const SIGNED_RECORD_DETAIL_TRAFFIC_NOTE =
  "Signed review record detail (Alerts/gov) - ManifestDetailPageView with PageContextualHelpButton (topic map review-packages; Category-1 registry on /governance/signed-records), Learn more / claim-discipline orientation strip (Sources follow-up removed TB-2092), summary/decisions/artifacts/bundle downloads, OperatorEvidenceLimitsFooter. Formerly `/signed-records/[manifestId]` (retired bookmark). Application-layer package lineage - not Trust Center attestation. Score 72/100 (2026-08-08) - package detail at RRE/GFN Evidence band; hard-caps higher Evidence without Trust Center diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a signed-record diligence Sources trail.";
