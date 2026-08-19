import { signedRecordArtifactPath } from "@/lib/signed-records-paths";

/**
 * Preview href for an artifact row — always signed-record SoT (GAR).
 * Optional `runId` is ignored; run-scoped RER bookmark redirect page was removed.
 */
export function artifactPreviewHref(
  manifestId: string,
  artifactId: string,
  _runId?: string | null,
): string {
  return signedRecordArtifactPath(manifestId, artifactId);
}
