/**
 * Canonical Report Problem copy for V1 (TB-782).
 * Keep aligned with `docs/library/REPORT_PROBLEM_V1_SCOPE.md` and TB-789 email ack.
 */

/** Placeholder token replaced with the durable problem-report reference id. */
export const REPORT_PROBLEM_ACK_REFERENCE_TOKEN = "{id}";

/** Owner SLA (2026-07-15) — same string in UI + email acknowledgement (TB-789). */
export const REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE =
  "We received your report (reference {id}). We'll respond by the next business day.";

/**
 * Formats the post-submit acknowledgement shown in-product and in email ack.
 */
export function formatReportProblemAcknowledgement(referenceId: string): string {
  const id = referenceId.trim();

  if (id.length === 0) {
    return REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE.replace(REPORT_PROBLEM_ACK_REFERENCE_TOKEN, "—");
  }

  return REPORT_PROBLEM_ACKNOWLEDGEMENT_TEMPLATE.replace(REPORT_PROBLEM_ACK_REFERENCE_TOKEN, id);
}

/** Checkbox / consent label before structured context is sent. */
export const REPORT_PROBLEM_CONSENT_LABEL =
  "Share investigation context with ArchLucid support (review and workspace identifiers, product version, browser summary, correlation ID, route, error title, and your note). We do not attach client log files, prompts, or evidence bodies unless you separately opt in to a redacted support bundle.";

/** Primary action label on error shells and API problem cards. */
export const REPORT_PROBLEM_ACTION_LABEL = "Report problem";

/** Tertiary mailto affordance may remain alongside Report problem (TB-786). */
export const REPORT_PROBLEM_EMAIL_SUPPORT_LABEL = "Email support";

/** Field glossary for dialog help text and support runbooks. */
export const REPORT_PROBLEM_FIELD_GLOSSARY = {
  reviewId: "Architecture review id when you were on a review route.",
  workspaceId: "Active workspace scope for the session.",
  tenantId: "Organization tenant scope (never shared across tenants).",
  productVersion: "ArchLucid API and UI build identifiers.",
  browserSummary: "Short browser and client summary — not a full log export.",
  correlationId: "Server correlation id tying your attempt to API logs.",
  clientRequestId: "Client request id when distinct from correlation id.",
  route: "Page path where you clicked Report problem.",
  errorCode: "HTTP status or application error code when available.",
  errorTitle: "Short failure headline shown on the page or error card.",
  operatorNote: "Optional context you add — avoid secrets or customer PII.",
} as const;

export type ReportProblemFieldKey = keyof typeof REPORT_PROBLEM_FIELD_GLOSSARY;
