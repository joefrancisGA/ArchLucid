import { reviewDetailPath } from "@/lib/architecture/architecture-routes";

/** Canonical buyer-facing list path for signed review records (TB-405 / IA-001). */
export const SIGNED_RECORDS_LIST_PATH = "/governance/signed-records";

/** Legacy top-level path — retired bookmark; canonical is {@link SIGNED_RECORDS_LIST_PATH}. */
export const LEGACY_SIGNED_RECORDS_LIST_PATH = "/signed-records";

/** True when `pathname` is the list or any detail/artifact route (canonical or legacy). */
export function pathMatchesSignedRecordsRoute(pathname: string): boolean {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return (
    normalized === SIGNED_RECORDS_LIST_PATH
    || normalized.startsWith(`${SIGNED_RECORDS_LIST_PATH}/`)
    || normalized === LEGACY_SIGNED_RECORDS_LIST_PATH
    || normalized.startsWith(`${LEGACY_SIGNED_RECORDS_LIST_PATH}/`)
  );
}

/** True when `pathname` is a manifest detail or artifact route (canonical or legacy). */
export function pathMatchesSignedRecordsDetailRoute(pathname: string): boolean {
  const normalized = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  return (
    normalized.startsWith(`${SIGNED_RECORDS_LIST_PATH}/`)
    || normalized.startsWith(`${LEGACY_SIGNED_RECORDS_LIST_PATH}/`)
  );
}

/** Canonical detail path for a signed review record by manifest id. */
export function signedRecordDetailPath(manifestId: string): string {
  return `${SIGNED_RECORDS_LIST_PATH}/${encodeURIComponent(manifestId.trim())}`;
}

/** Run-scoped signed record CTA — opens the review package (manifest section when finalized). */
export function reviewSignedRecordPath(runId: string): string {
  return reviewDetailPath(runId);
}

/** Artifact row within a signed review record. */
export function signedRecordArtifactPath(manifestId: string, artifactId: string): string {
  return `${signedRecordDetailPath(manifestId)}/artifacts/${encodeURIComponent(artifactId.trim())}`;
}

/** Manifest record page section anchor (`#manifest-decisions`, …). */
export function signedRecordSectionPath(manifestId: string, sectionId: string): string {
  return `${signedRecordDetailPath(manifestId)}#${sectionId.trim()}`;
}
