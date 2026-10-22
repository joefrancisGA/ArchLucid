/**
 * Short, sober copy for Enterprise Controls context (nav, key pages, and selected empty-state / card-description strings).
 * Aligned with docs/OPERATOR_DECISION_GUIDE.md (default rule, §2 “Move to Enterprise Controls”) and
 * docs/COMMERCIAL_BOUNDARY_HARDENING_SEQUENCE.md (Stage 1 — role clarity without commercializing the wedge).
 * Keep wording responsibility-based, not permission-jargon.
 *
 * **Rank pairing:** several `*Reader*` / `*Operator*` pairs are chosen in pages via `useOperateCapability()` or
 * `useNavCallerAuthorityRank()` vs `AUTHORITY_RANK.ExecuteAuthority` — keep thresholds aligned with `nav-authority.ts`.
 */

/**
 * Shared one-liner under alert-tooling “Change configuration” sections — replaces repeating “Configuration surface…”
 * on every page (`alert-rules`, `alert-routing`, `alert-tuning`, `composite-alert-rules`).
 */

export const auditExportControlDisabledTitle =
  "Available to authorized audit users in this workspace; adjust date filters or roles if export stays unavailable.";


export const auditSearchEventsSectionHeadingOperator = "Search audit events";


export const auditSearchEventsSectionHeadingReader = "Search audit events (inspect)";


export const auditSearchEventsSectionHeadingBuyerPolished = "Filters";


export const auditSearchEventsButtonLabelReaderRank = "Search audit trail";


export const auditSearchEventsButtonTitleOperator = "Run search with the current filter fields (GET).";


export const auditSearchEventsButtonTitleReader =
  "Run search (GET). CSV export remains Auditor/Admin-gated on the API.";


export const auditResultsSectionHeadingOperator = "Audit results";


export const auditResultsSectionHeadingReader = "Audit results (inspect)";


export const auditResultsSectionHeadingBuyerPolished = "Audit results";


export const auditLoadMoreButtonTitleOperator = "Load the next page of audit events for the current filters (GET).";


export const auditLoadMoreButtonTitleReader =
  "Load older rows (GET). Export rules unchanged on the API.";


export const auditClearFiltersButtonLabelReaderRank = "Clear filters & search";


export const auditLogRankReaderLine =
  "Audit exports are available only to authorized audit or workspace administrators when your time window is set.";


export const auditLogRankOperatorLine =
  "Audit exports are available only to authorized audit or workspace administrators.";


export const auditSearchNoResultsReaderLine = "No audit events match your search.";


export const auditSearchNoResultsBuyerPolishedLine =
  "No events match the current review and filter settings.";


export const auditSearchNoResultsOperatorLine = "No audit events match your filters.";


export const auditSearchSectionLeadReaderLine =
  "Bulk CSV downloads need Auditor or Admin (search above stays available).";


export const auditExportSectionSupportingLine =
  "Bulk downloads need Auditor or Admin; pick Start date and End date, then Export audit trail.";


export const auditExportSectionSupportingLineBuyerPolished =
  "Authorized users can export this audit trail as CSV for the selected date range.";


export const auditExportCsvButtonLabelWindowIncomplete = "Export audit trail (set Start date/End date)";


export const auditExportCsvButtonLabelRoleRestricted = "Download audit trail";


export const auditResultsSectionIntroBuyerPolished =
  "Events are grouped by lifecycle stage. Expand a row for structured details.";


export const auditExportSampleWorkspaceCsvHintBuyerPolished =
  "In this demonstration workspace, bulk CSV export follows the same role and date-window rules as production.";


export const auditBuyerUtilitiesDetailsSummary = "Audit utilities";


export const auditExportExecuteRankAuditorRoleNote =
  "Exports are available to authorized audit users — your current role can review events in the UI but not download the CSV bundle.";

