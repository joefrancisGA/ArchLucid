/** Buyer-safe copy for `/why-archlucid` sponsor proof surfaces (TB-1308). */

/** TB-1307: operator telemetry page title — not the marketing `/why` H1 twin. */
export const WHY_ARCHLUCID_PAGE_TITLE = "Pilot proof telemetry";

export const WHY_ARCHLUCID_PAGE_ORIENTATION_OPERATOR =
  "Live sponsor counters and seeded demo instrumentation for pilots — not the public marketing comparison page.";

export const WHY_ARCHLUCID_PAGE_ORIENTATION_BUYER =
  "Seeded pilot counters and sponsor-pack telemetry — orientation only, not procurement evidence.";

/** @deprecated Use {@link whyArchLucidPageOrientation} — kept for legacy imports. */
export const WHY_ARCHLUCID_PAGE_ORIENTATION = WHY_ARCHLUCID_PAGE_ORIENTATION_OPERATOR;

export function whyArchLucidPageOrientation(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? WHY_ARCHLUCID_PAGE_ORIENTATION_BUYER
    : WHY_ARCHLUCID_PAGE_ORIENTATION_OPERATOR;
}

export const WHY_ARCHLUCID_MARKETING_WHY_HREF = "/why" as const;

export const WHY_ARCHLUCID_MARKETING_WHY_LINK_LABEL = "Public differentiation (/why)";

export const WHY_ARCHLUCID_BREADCRUMB_LEARNING_LABEL = "Help";

export const WHY_ARCHLUCID_BREADCRUMB_LEARNING_HREF = "/help" as const;

export const WHY_ARCHLUCID_INTERNAL_PILOT_BADGE_LABEL = "Internal pilot proof";

export const WHY_ARCHLUCID_PAGE_LOADING_STATUS = "Loading pilot proof telemetry and sponsor pack bundles…";

export const WHY_ARCHLUCID_PAGE_LOAD_RETRY_LABEL = "Retry loading telemetry";

export const WHY_ARCHLUCID_DOCUMENT_TITLE = `ArchLucid · ${WHY_ARCHLUCID_PAGE_TITLE}`;

/** TB-1309: primary hop from proof telemetry into the seeded sample review package. */
export const WHY_ARCHLUCID_PRIMARY_CTA_LABEL = "Open sample architecture package";

export function whyArchLucidSampleReviewHref(demoRunId: string | null | undefined): string | null {
  const trimmed = demoRunId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return `/architecture/reviews/${trimmed}`;
}

export const WHY_ARCHLUCID_COUNTERS_INTRO =
  "Host-cumulative process totals since this API replica started. Persisted snapshot and single-review figures below use narrower scopes and may differ.";

export const WHY_ARCHLUCID_COUNTER_LABEL_RUNS_CREATED = "Architecture reviews created (host scope)";

export const WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED = "Reviews created since this API host started";

export const WHY_ARCHLUCID_COUNTER_LABEL_HOURS_SAVED = "Est. manual hours saved (host scope)";

export const WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED =
  "Planning heuristic when a completed review is in scope";

export const WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED_ZERO =
  "Not yet estimated — requires a completed review in scope";

export const WHY_ARCHLUCID_COUNTER_LABEL_AUDIT_ROWS = "Audit trail rows (host scope)";

export const WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS = "Audit trail rows counted across the host process lifetime";

export function whyArchlucidCounterHintAuditRowsTruncated(cap: number): string {
  return `Audit trail rows in host scope (showing first ${cap})`;
}

export const WHY_ARCHLUCID_COUNTER_LABEL_FINDINGS = "Findings (host scope, all severities)";

export const WHY_ARCHLUCID_COUNTER_HINT_FINDINGS = "Findings produced across all reviews since host start";

export const WHY_ARCHLUCID_SNAPSHOT_REVIEW_ID_LABEL = "Sample review identifier";

export const WHY_ARCHLUCID_EXPLAINABILITY_COMPLETENESS_CAPTION =
  "Share of explainability fields populated in the persisted evidence snapshot (100% = all tracked fields present)";

export const WHY_ARCHLUCID_SPONSOR_PACK_FINDINGS_CAPTION = "Findings in the persisted evidence snapshot";

export const WHY_ARCHLUCID_VALUE_REPORT_DELTA_AUDIT_LABEL = "Audit trail rows (this demo review)";

export const WHY_ARCHLUCID_FIRST_VALUE_REPORT_HELPER =
  "Sponsor-facing markdown generated from the committed Retail baseline demo review.";

export const WHY_ARCHLUCID_FIRST_VALUE_REPORT_MISSING =
  "The demo review has not been committed yet — seed the Retail baseline sample workspace and refresh.";

export const WHY_ARCHLUCID_VALUE_REPORT_DELTA_UNAVAILABLE =
  "Value-report deltas are unavailable until the canonical demo review is present in scope — seed the Retail baseline sample workspace and refresh.";

export const WHY_ARCHLUCID_MEASURED_CONTEXT_TITLE = "Pilot cost guidance";

export const WHY_ARCHLUCID_MEASURED_CONTEXT_INTRO =
  "Tenant tier and monthly spend band when configured. Planning guidance only — not an invoice.";

export const WHY_ARCHLUCID_FOOTER_SPONSOR_BRIEF_LABEL = "Sponsor brief";

export const WHY_ARCHLUCID_FOOTER_SPONSOR_BRIEF_HREF = "/help/sponsor-report" as const;

export const WHY_ARCHLUCID_FOOTER_GETTING_STARTED_LABEL = "Getting started";

export const WHY_ARCHLUCID_FOOTER_GETTING_STARTED_HREF = "/get-started" as const;

export const WHY_ARCHLUCID_FOOTER_TRUST_CENTER_LABEL = "Trust center";

export const WHY_ARCHLUCID_FOOTER_TRUST_CENTER_HREF = "/trust" as const;
