import {
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF,
  ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL,
} from "@/lib/alerts-page-copy";

export const AUDIT_EVIDENCE_PAGE_TITLE = "Audit evidence lineage" as const;

export const AUDIT_EVIDENCE_PRIMARY_CONTENT_ID = "audit-evidence-primary-content" as const;

export const AUDIT_EVIDENCE_SKIP_LINK_LABEL = "Skip to audit evidence lookup" as const;

export const AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_LABEL = ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_LABEL;

export const AUDIT_EVIDENCE_BREADCRUMB_GOVERNANCE_HREF = ALERTS_CONFIGURATION_BREADCRUMB_GOVERNANCE_HREF;

export const AUDIT_EVIDENCE_BREADCRUMB_TOPIC_TITLE = AUDIT_EVIDENCE_PAGE_TITLE;

export const AUDIT_EVIDENCE_PAGE_LEAD =
  "Open deterministic evidence lineage for an audit control. Enter IDs from an assessment snapshot export or API integration — not an AI summary." as const;

export const AUDIT_EVIDENCE_CLAIM_DISCIPLINE =
  "This lookup opens read-only evidence lineage for one control in one snapshot. It does not replace audit trail activity, sealed review records, or official assurance materials." as const;

export const AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL = "Assessment ID" as const;

export const AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL = "Snapshot ID" as const;

export const AUDIT_EVIDENCE_CONTROL_ID_LABEL = "Control ID" as const;

export const AUDIT_EVIDENCE_ASSESSMENT_ID_HINT =
  "UUID from your assessment export, for example 11111111-1111-1111-1111-111111111111." as const;

export const AUDIT_EVIDENCE_SNAPSHOT_ID_HINT =
  "Snapshot UUID from the same export bundle — one frozen point-in-time assessment capture." as const;

export const AUDIT_EVIDENCE_CONTROL_ID_HINT =
  "Control UUID or stable control key from the snapshot, for example AC-2 or a platform control id." as const;

export const AUDIT_EVIDENCE_LINEAGE_URL_LABEL = "Lineage Link" as const;

/** Namespace-aware paste hint for the active product-line lookup path. */
export function auditEvidenceLineageUrlHintForLookupPath(lookupPath: string): string {
  return `Paste a full ${lookupPath}/…/controls/… URL from email, ITSM, or an export, then choose Apply link.`;
}

export const AUDIT_EVIDENCE_LINEAGE_URL_APPLY_ACTION = "Apply link" as const;

export const AUDIT_EVIDENCE_LINEAGE_URL_UNDO_ACTION = "Undo paste" as const;

export const AUDIT_EVIDENCE_LINEAGE_URL_APPLIED_LIVE_MESSAGE =
  "Lineage link applied to the identifier fields." as const;

/** @deprecated Prefer {@link auditEvidenceLineageUrlHintForLookupPath}. */
export const AUDIT_EVIDENCE_LINEAGE_URL_HINT =
  "Paste a full /governance/audit-evidence/…/controls/… URL from email, ITSM, or an export to fill the fields below." as const;

export const AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION = "Open evidence lineage" as const;

export const AUDIT_EVIDENCE_START_FROM_INVENTORY_TITLE = "Start from inventory" as const;

export const AUDIT_EVIDENCE_START_FROM_INVENTORY_BODY =
  "Open a cloud resource hub to copy assessment, snapshot, and control IDs from linked audit evidence." as const;

export const AUDIT_EVIDENCE_START_FROM_INVENTORY_ACTION = "Browse resource inventory" as const;

export const AUDIT_EVIDENCE_FIELD_REQUIRED = "Required." as const;

export const AUDIT_EVIDENCE_ASSESSMENT_ID_SHAPE_ERROR =
  "Enter a UUID-shaped assessment ID from your export." as const;

export const AUDIT_EVIDENCE_SNAPSHOT_ID_SHAPE_ERROR =
  "Enter a UUID-shaped snapshot ID from the same export bundle." as const;

export const AUDIT_EVIDENCE_CONTROL_ID_SHAPE_ERROR =
  "Enter a control UUID or stable control key (for example AC-2)." as const;

export function auditEvidenceLineageUrlParseErrorForLookupPath(lookupPath: string): string {
  return `Paste an audit-evidence control URL that starts with ${lookupPath}/ and includes assessment, snapshot, and control segments.`;
}

/** @deprecated Prefer {@link auditEvidenceLineageUrlParseErrorForLookupPath}. */
export const AUDIT_EVIDENCE_LINEAGE_URL_PARSE_ERROR =
  "Paste a governance audit-evidence control URL with assessment, snapshot, and control segments." as const;

export const AUDIT_EVIDENCE_LOOKUP_SCOPE_PREFIX = "Workspace scope" as const;

export const AUDIT_EVIDENCE_LOOKUP_CHANGE_SCOPE_ACTION = "Change scope" as const;

export const AUDIT_EVIDENCE_LOOKUP_IDENTIFIERS_CONSOLIDATED_HINT =
  "Enter assessment, snapshot, and control IDs from the same export bundle." as const;

export const AUDIT_EVIDENCE_LOOKUP_READINESS_READY =
  "Identifiers are ready — open read-only evidence lineage for this control." as const;

export const AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_PREFIX =
  "Enter valid" as const;

export const AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_SUFFIX =
  "to enable Open evidence lineage." as const;

export const AUDIT_EVIDENCE_LOOKUP_ERROR_SUMMARY_TITLE =
  "Fix these fields before opening evidence lineage:" as const;

export const AUDIT_EVIDENCE_LOOKUP_KEYBOARD_AFFORDANCE =
  "F1 opens page help; Ctrl+K opens search; Ctrl+Enter opens evidence lineage when identifiers are valid." as const;

export const AUDIT_EVIDENCE_LOOKUP_OPEN_LINEAGE_SHORTCUT = "Ctrl+Enter" as const;

export const AUDIT_EVIDENCE_LOOKUP_BUILD_PROVENANCE_LIMITATION =
  "Provenance limitation: build identity is unavailable in this environment, so screenshots and support bundles cannot be tied to a deployed UI commit from this page alone." as const;

export const AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_TITLE = "Continue last viewed lineage" as const;

export const AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_EMPTY =
  "No recent evidence lineage visits in this browser." as const;

export const AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_COPY_ACTION = "Copy link" as const;

export const AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_FILL_ACTION = "Fill lookup fields" as const;

export const AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_IDS_DISCLOSURE = "Show IDs" as const;

export function formatAuditEvidenceLineageUrlAppliedConfirmation(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): string {
  return `Filled Assessment ID (${assessmentId.trim()}), Snapshot ID (${snapshotId.trim()}), and Control ID (${controlId.trim()}).`;
}

export const AUDIT_EVIDENCE_LOOKUP_FORM_SECTION_TITLE = "Enter control identifiers" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_TITLE = "Control chain of custody" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_PRIMARY_CONTENT_ID =
  "audit-evidence-control-lineage-primary-content" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_SKIP_LINK_LABEL = "Skip to chain of custody" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_BREADCRUMB_LABEL = AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_TITLE;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_LEAD =
  "Read-only chain of custody from audit control through requirements, evaluation, and collected evidence for one snapshot." as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_CLAIM_DISCIPLINE =
  "Deterministic linkage only — not an AI determination. Missing evidence links block a positive support checkbox." as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_IDENTIFIERS_TITLE = "Route identifiers" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_TITLE = "Chain of custody unavailable" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_ERROR_BODY =
  "Could not load the chain of custody for this control. Retry after confirming the assessment snapshot service is available, or return to lookup with corrected IDs." as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_RETRY_ACTION = "Retry loading chain" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_BACK_TO_LOOKUP_ACTION = "Back to audit evidence lookup" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_EXPAND_ACTION = "Show chain of custody" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_COLLAPSE_ACTION = "Hide chain of custody" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_LOADING_LABEL = "Loading chain of custody…" as const;

export const AUDIT_EVIDENCE_PACKAGE_DOWNLOAD_ERROR_TITLE =
  "Audit evidence bundle download failed" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_SNAPSHOT_SCOPE_NOTE =
  "Downloads include only artifacts captured in this assessment snapshot — not a full workspace audit export or sealed review record." as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_ACTION =
  "Download snapshot evidence bundle (ZIP)" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_PACKAGE_DOWNLOAD_BUSY =
  "Preparing snapshot bundle…" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_COPY_LINK_ACTION = "Copy lineage link" as const;

export const AUDIT_EVIDENCE_CONTROL_LINEAGE_KEYBOARD_AFFORDANCE =
  "F1 opens page help; Ctrl+K opens search; use Back to audit evidence lookup to return to identifier entry." as const;

export function formatAuditEvidenceControlLineagePageTitle(
  controlNumber: string | null | undefined,
  controlTitle: string | null | undefined,
): string {
  const number = controlNumber?.trim() ?? "";
  const title = controlTitle?.trim() ?? "";

  if (number.length > 0 && title.length > 0) {
    return `${number}: ${title}`;
  }

  if (number.length > 0) {
    return number;
  }

  if (title.length > 0) {
    return title;
  }

  return AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_TITLE;
}
