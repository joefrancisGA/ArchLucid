/** Buyer-safe copy for `/why-archlucid` sponsor proof surfaces (TB-1308). */

export const WHY_ARCHLUCID_COUNTERS_INTRO =
  "Cumulative process totals since this API host started, plus audit trail rows in scope for the demo review.";

export const WHY_ARCHLUCID_COUNTER_HINT_RUNS_CREATED = "Reviews created since host start";

export const WHY_ARCHLUCID_COUNTER_HINT_HOURS_SAVED = "Planning heuristic — see methodology footnote";

export const WHY_ARCHLUCID_COUNTER_HINT_AUDIT_ROWS = "Audit trail rows in demo scope";

export function whyArchlucidCounterHintAuditRowsTruncated(cap: number): string {
  return `Audit trail rows in demo scope (showing first ${cap})`;
}

export const WHY_ARCHLUCID_COUNTER_HINT_FINDINGS = "Findings across all severities";

export const WHY_ARCHLUCID_FOOTER_EXECUTIVE_BRIEF_LABEL = "Executive sponsor brief";

export const WHY_ARCHLUCID_FOOTER_EXECUTIVE_BRIEF_HREF = "/help/executive-summary" as const;

export const WHY_ARCHLUCID_FOOTER_GETTING_STARTED_LABEL = "Getting started";

export const WHY_ARCHLUCID_FOOTER_GETTING_STARTED_HREF = "/get-started" as const;

export const WHY_ARCHLUCID_FOOTER_TRUST_CENTER_LABEL = "Trust Center";

export const WHY_ARCHLUCID_FOOTER_TRUST_CENTER_HREF = "/trust" as const;
