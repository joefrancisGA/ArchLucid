import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

/**
 * Run-scoped artifact Preview entry (App Router under reviews → redirect to signed-records).
 * Uses {@link REVIEWS_LIST_PATH} so public vs on-disk list prefix stay consistent.
 */
export function runArtifactPreviewPath(runId: string, artifactId: string): string {
  const trimmedRunId = runId.trim();
  const trimmedArtifactId = artifactId.trim();

  return `${REVIEWS_LIST_PATH}/${encodeURIComponent(trimmedRunId)}/artifacts/${encodeURIComponent(trimmedArtifactId)}`;
}

/**
 * Preview href for an artifact row: run-scoped when `runId` is set, otherwise manifest-scoped.
 * Both targets have App Router `page.tsx` entry points (TB-1821 / TB-1822).
 */
export function artifactPreviewHref(
  manifestId: string,
  artifactId: string,
  runId?: string | null,
): string {
  const trimmedRunId = runId?.trim() ?? "";

  if (trimmedRunId.length > 0) {
    return runArtifactPreviewPath(trimmedRunId, artifactId);
  }

  return signedRecordArtifactPath(manifestId, artifactId);
}
