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
  "Open the deterministic chain of custody for an audit control. Enter IDs from an assessment snapshot export or API integration — not an AI summary." as const;

export const AUDIT_EVIDENCE_CLAIM_DISCIPLINE =
  "This lookup opens a read-only lineage spine for one control in one snapshot. It does not replace audit trail activity, sealed review records, or official assurance materials." as const;

export const AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL = "Assessment ID" as const;

export const AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL = "Snapshot ID" as const;

export const AUDIT_EVIDENCE_CONTROL_ID_LABEL = "Control ID" as const;

export const AUDIT_EVIDENCE_ASSESSMENT_ID_HINT =
  "UUID from your assessment export, for example 11111111-1111-1111-1111-111111111111." as const;

export const AUDIT_EVIDENCE_SNAPSHOT_ID_HINT =
  "Snapshot UUID from the same export bundle — one frozen point-in-time assessment capture." as const;

export const AUDIT_EVIDENCE_CONTROL_ID_HINT =
  "Control UUID or stable control key from the snapshot, for example AC-2 or a platform control id." as const;

export const AUDIT_EVIDENCE_LINEAGE_URL_LABEL = "Paste lineage link" as const;

export const AUDIT_EVIDENCE_LINEAGE_URL_HINT =
  "Paste a full /governance/audit-evidence/…/controls/… URL from email, ITSM, or an export to fill the fields below." as const;

export const AUDIT_EVIDENCE_OPEN_LINEAGE_ACTION = "Open chain of custody" as const;

export const AUDIT_EVIDENCE_START_FROM_INVENTORY_TITLE = "Start from inventory" as const;

export const AUDIT_EVIDENCE_START_FROM_INVENTORY_BODY =
  "Open a cloud resource hub to copy assessment, snapshot, and control IDs from linked audit evidence." as const;

export const AUDIT_EVIDENCE_START_FROM_INVENTORY_ACTION = "Browse resource inventory" as const;

export const AUDIT_EVIDENCE_FIELD_REQUIRED = "Required." as const;

export const AUDIT_EVIDENCE_LINEAGE_URL_PARSE_ERROR =
  "Paste a governance audit-evidence control URL with assessment, snapshot, and control segments." as const;

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

