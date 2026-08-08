import { LEGACY_SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/**
 * Traffic workbook row ID for signed review record detail.
 * Owner backlog shorthand: MMX.
 */
export const SIGNED_RECORD_DETAIL_TRAFFIC_ROW_ID = "MMX";

/** Legacy bookmark path tracked on the MMX workbook row (governance alias is redirect-only per TB-748). */
export const SIGNED_RECORD_DETAIL_TRAFFIC_PATH = `${LEGACY_SIGNED_RECORDS_LIST_PATH}/[manifestId]` as const;

/** Workbook Section column value (governance package surface). */
export const SIGNED_RECORD_DETAIL_TRAFFIC_SECTION = "Alerts/gov";

/**
 * Owner workbook Notes for MMX — documents Evidence chrome on signed-record detail.
 */
export const SIGNED_RECORD_DETAIL_TRAFFIC_NOTE =
  "Signed review record detail (Alerts/gov) - ManifestDetailPageView with PageContextualHelpButton (topic map review-packages; Category-1 registry on /governance/signed-records), workspace Sources + claim-discipline orientation strip, summary/decisions/artifacts/bundle downloads, OperatorEvidenceLimitsFooter. Application-layer package lineage — not CPA SOC 2 or third-party pen-test publication. Score 58/100 (2026-08-03) — package detail hard-caps higher Evidence without Trust Center attestation artifacts.";
