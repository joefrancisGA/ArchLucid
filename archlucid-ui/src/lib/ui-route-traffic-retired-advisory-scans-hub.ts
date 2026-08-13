import { ADVISORY_SCANS_SCANS_HREF } from "@/lib/advisory-scans-route";

/**
 * Removed traffic workbook row ID for the retired `/governance/advisory-scans` hub row.
 * Do not reintroduce — advisory scans UX is scored only on AD/ADT tab rows.
 */
export const REMOVED_ADVISORY_SCANS_HUB_TRAFFIC_ROW_ID = "ADV";

/** Retired hub path — not a standalone scored workbook row. */
export const RETIRED_ADVISORY_SCANS_HUB_TRAFFIC_PATH = "/governance/advisory-scans";

/** Default Scans tab absorbs legacy hub and `/advisory` bookmark Hit%. */
export const CANONICAL_ADVISORY_SCANS_DEFAULT_TAB_TRAFFIC_PATH = ADVISORY_SCANS_SCANS_HREF;
