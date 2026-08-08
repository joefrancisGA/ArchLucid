import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

/**
 * Run-scoped artifact Preview bookmark path (App Router permanentRedirect → signed-records).
 * Product Preview links must use {@link artifactPreviewHref} (GAR), not this helper.
 */
export function runArtifactPreviewPath(runId: string, artifactId: string): string {
  const trimmedRunId = runId.trim();
  const trimmedArtifactId = artifactId.trim();

  return `${REVIEWS_LIST_PATH}/${encodeURIComponent(trimmedRunId)}/artifacts/${encodeURIComponent(trimmedArtifactId)}`;
}

/**
 * Preview href for an artifact row — always signed-record SoT (GAR).
 * Optional `runId` is ignored for href emission; bookmark RER redirects still resolve run→manifest.
 */
export function artifactPreviewHref(
  manifestId: string,
  artifactId: string,
  _runId?: string | null,
): string {
  return signedRecordArtifactPath(manifestId, artifactId);
}
