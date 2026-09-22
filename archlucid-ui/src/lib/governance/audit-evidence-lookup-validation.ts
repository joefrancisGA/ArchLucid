import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

import {
  AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL,
  AUDIT_EVIDENCE_ASSESSMENT_ID_SHAPE_ERROR,
  AUDIT_EVIDENCE_CONTROL_ID_LABEL,
  AUDIT_EVIDENCE_CONTROL_ID_SHAPE_ERROR,
  AUDIT_EVIDENCE_FIELD_REQUIRED,
  AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_PREFIX,
  AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_SUFFIX,
  AUDIT_EVIDENCE_LOOKUP_READINESS_READY,
  AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL,
  AUDIT_EVIDENCE_SNAPSHOT_ID_SHAPE_ERROR,
} from "@/lib/audit-evidence-page-copy";

const CONTROL_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

export type AuditEvidenceLookupFieldErrors = {
  readonly assessmentId?: string;
  readonly snapshotId?: string;
  readonly controlId?: string;
  readonly lineageUrl?: string;
};

export type AuditEvidenceLookupFieldKey = keyof AuditEvidenceLookupFieldErrors;

export type AuditEvidenceLookupIdentifierFieldKey = Exclude<AuditEvidenceLookupFieldKey, "lineageUrl">;

const IDENTIFIER_FIELD_LABELS: Readonly<Record<AuditEvidenceLookupIdentifierFieldKey, string>> = {
  assessmentId: AUDIT_EVIDENCE_ASSESSMENT_ID_LABEL,
  snapshotId: AUDIT_EVIDENCE_SNAPSHOT_ID_LABEL,
  controlId: AUDIT_EVIDENCE_CONTROL_ID_LABEL,
};

export function isAuditEvidenceControlIdShape(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (isUuidLike(trimmed)) {
    return true;
  }

  return CONTROL_KEY_PATTERN.test(trimmed);
}

function trimRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateAuditEvidenceLookupIdentifiers(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): AuditEvidenceLookupFieldErrors {
  const nextErrors: Partial<Record<AuditEvidenceLookupFieldKey, string>> = {};

  if (!trimRequired(assessmentId)) {
    nextErrors.assessmentId = AUDIT_EVIDENCE_FIELD_REQUIRED;
  } else if (!isUuidLike(assessmentId)) {
    nextErrors.assessmentId = AUDIT_EVIDENCE_ASSESSMENT_ID_SHAPE_ERROR;
  }

  if (!trimRequired(snapshotId)) {
    nextErrors.snapshotId = AUDIT_EVIDENCE_FIELD_REQUIRED;
  } else if (!isUuidLike(snapshotId)) {
    nextErrors.snapshotId = AUDIT_EVIDENCE_SNAPSHOT_ID_SHAPE_ERROR;
  }

  if (!trimRequired(controlId)) {
    nextErrors.controlId = AUDIT_EVIDENCE_FIELD_REQUIRED;
  } else if (!isAuditEvidenceControlIdShape(controlId)) {
    nextErrors.controlId = AUDIT_EVIDENCE_CONTROL_ID_SHAPE_ERROR;
  }

  return nextErrors;
}

export function auditEvidenceLookupIdentifiersReady(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): boolean {
  return Object.keys(validateAuditEvidenceLookupIdentifiers(assessmentId, snapshotId, controlId)).length === 0;
}

function formatIdentifierFieldList(fields: readonly AuditEvidenceLookupIdentifierFieldKey[]): string {
  const labels = fields.map((field) => IDENTIFIER_FIELD_LABELS[field]);

  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0] ?? "";
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1) ?? ""}`;
}

export function invalidAuditEvidenceLookupIdentifierFields(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): readonly AuditEvidenceLookupIdentifierFieldKey[] {
  const errors = validateAuditEvidenceLookupIdentifiers(assessmentId, snapshotId, controlId);
  const invalidFields: AuditEvidenceLookupIdentifierFieldKey[] = [];

  for (const field of ["assessmentId", "snapshotId", "controlId"] as const) {
    if (errors[field] !== undefined) {
      invalidFields.push(field);
    }
  }

  return invalidFields;
}

export function formatAuditEvidenceLookupReadinessMessage(
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): string {
  if (auditEvidenceLookupIdentifiersReady(assessmentId, snapshotId, controlId)) {
    return AUDIT_EVIDENCE_LOOKUP_READINESS_READY;
  }

  const invalidFields = invalidAuditEvidenceLookupIdentifierFields(assessmentId, snapshotId, controlId);
  const fieldList = formatIdentifierFieldList(invalidFields);

  if (fieldList.length === 0) {
    return `${AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_PREFIX} identifiers ${AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_SUFFIX}`;
  }

  return `${AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_PREFIX} ${fieldList} ${AUDIT_EVIDENCE_LOOKUP_READINESS_BLOCKED_SUFFIX}`;
}

export function validateAuditEvidenceLookupIdentifierField(
  field: AuditEvidenceLookupIdentifierFieldKey,
  assessmentId: string,
  snapshotId: string,
  controlId: string,
): string | undefined {
  const errors = validateAuditEvidenceLookupIdentifiers(assessmentId, snapshotId, controlId);

  return errors[field];
}

export const AUDIT_EVIDENCE_LOOKUP_FIELD_ORDER: readonly AuditEvidenceLookupFieldKey[] = [
  "lineageUrl",
  "assessmentId",
  "snapshotId",
  "controlId",
];

export function firstInvalidAuditEvidenceLookupFieldId(
  errors: AuditEvidenceLookupFieldErrors,
): string | null {
  for (const key of AUDIT_EVIDENCE_LOOKUP_FIELD_ORDER) {
    if (errors[key] !== undefined) {
      switch (key) {
        case "lineageUrl":
          return "audit-evidence-lineage-url";
        case "assessmentId":
          return "audit-evidence-assessment-id";
        case "snapshotId":
          return "audit-evidence-snapshot-id";
        case "controlId":
          return "audit-evidence-control-id";
        default: {
          const _exhaustive: never = key;
          return _exhaustive;
        }
      }
    }
  }

  return null;
}
