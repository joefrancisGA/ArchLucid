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

/** Dialog chrome (TB-784). */
export const REPORT_PROBLEM_DIALOG_TITLE = "Report a problem";

export const REPORT_PROBLEM_DIALOG_DESCRIPTION =
  "Review the diagnostic details we can share with support, add a short note if helpful, and confirm consent before submitting.";

export const REPORT_PROBLEM_SUMMARY_TITLE = "Diagnostic details";

export const REPORT_PROBLEM_FIELD_LABEL_REVIEW_ID = "Review ID";

export const REPORT_PROBLEM_FIELD_LABEL_WORKSPACE = "Workspace";

export const REPORT_PROBLEM_FIELD_LABEL_REFERENCE_ID = "Reference ID";

export const REPORT_PROBLEM_FIELD_LABEL_PRODUCT_VERSION = "Product version";

export const REPORT_PROBLEM_DETAILS_SUMMARY_LABEL = "What we'll send";

export const REPORT_PROBLEM_FIELD_LABEL_ROUTE = "Route";

export const REPORT_PROBLEM_FIELD_LABEL_ERROR = "Error";

export const REPORT_PROBLEM_FIELD_LABEL_BROWSER = "Browser";

export const REPORT_PROBLEM_FIELD_LABEL_API_COMMIT = "API commit";

export const REPORT_PROBLEM_FIELD_LABEL_UI_COMMIT = "UI commit";

export const REPORT_PROBLEM_FIELD_LABEL_DEPLOY_STAMP = "Build / CI stamp";

export const REPORT_PROBLEM_FIELD_LABEL_ENVIRONMENT = "Environment";

export const REPORT_PROBLEM_API_UI_MISMATCH_HINT =
  "API and UI commit SHAs differ — this session may be mid-deploy or split across revisions.";

export const REPORT_PROBLEM_NOTE_LABEL = "What happened?";

export const REPORT_PROBLEM_NOTE_PLACEHOLDER =
  "Optional — describe what you were trying to do. Avoid secrets or customer PII.";

/** Max operator note length enforced in dialog and intake API (TB-788). */
export const REPORT_PROBLEM_OPERATOR_NOTE_MAX_LENGTH = 2000;

export const REPORT_PROBLEM_ATTACH_BUNDLE_LABEL = "Attach a redacted support bundle";

export const REPORT_PROBLEM_ATTACH_BUNDLE_HINT =
  "Optional ZIP with redacted build, health, and config summaries — no browser logs or evidence bodies.";

export const REPORT_PROBLEM_ATTACH_BUNDLE_HELP_HREF = "/help/troubleshooting#support-bundle-attach-to-tickets";

export const REPORT_PROBLEM_ATTACH_BUNDLE_HELP_LINK_LABEL = "Support bundle checklist";

export const REPORT_PROBLEM_SUBMIT_LABEL = "Submit report";

export const REPORT_PROBLEM_CANCEL_LABEL = "Cancel";

export const REPORT_PROBLEM_ACK_HEADING = "Report submitted";

export const REPORT_PROBLEM_MISSING_VALUE = "—";

/** Tertiary mailto affordance may remain alongside Report problem (TB-786). */
export const REPORT_PROBLEM_EMAIL_SUPPORT_LABEL = "Email support";

/** Field glossary for dialog help text and support runbooks. */
export const REPORT_PROBLEM_FIELD_GLOSSARY = {
  reviewId: "Architecture review id when you were on a review route.",
  workspaceId: "Active workspace scope for the session.",
  tenantId: "Organization tenant scope (never shared across tenants).",
  productVersion: "ArchLucid API and UI build identifiers (deploy stamp + commit SHAs).",
  deployStamp: "CI/deploy stamp (GitHub Actions run id + attempt) shared by the deployed images.",
  apiCommitSha: "API image commit SHA from GET /version.",
  uiCommitSha: "UI image commit SHA baked at container build time.",
  browserSummary: "Short browser and client summary — not a full log export.",
  correlationId: "Server correlation id tying your attempt to API logs.",
  clientRequestId: "Client request id when distinct from correlation id.",
  route: "Page path where you clicked Report problem.",
  errorCode: "HTTP status or application error code when available.",
  errorTitle: "Short failure headline shown on the page or error card.",
  operatorNote: "Optional context you add — avoid secrets or customer PII.",
} as const;

export type ReportProblemFieldKey = keyof typeof REPORT_PROBLEM_FIELD_GLOSSARY;
