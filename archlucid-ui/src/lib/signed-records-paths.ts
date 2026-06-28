/** Canonical buyer-facing list path for signed review records (TB-399). */
export const SIGNED_RECORDS_LIST_PATH = "/signed-records";

/** Canonical detail path for a signed review record by manifest id. */
export function signedRecordDetailPath(manifestId: string): string {
  return `${SIGNED_RECORDS_LIST_PATH}/${encodeURIComponent(manifestId.trim())}`;
}

/** Run-scoped signed record deep link when manifest id is not yet known. */
export function reviewSignedRecordPath(runId: string): string {
  return `/reviews/${encodeURIComponent(runId.trim())}/signed-record`;
}

/** Artifact row within a signed review record. */
export function signedRecordArtifactPath(manifestId: string, artifactId: string): string {
  return `${signedRecordDetailPath(manifestId)}/artifacts/${encodeURIComponent(artifactId.trim())}`;
}

/** Manifest record page section anchor (`#manifest-decisions`, …). */
export function signedRecordSectionPath(manifestId: string, sectionId: string): string {
  return `${signedRecordDetailPath(manifestId)}#${sectionId.trim()}`;
}
