import { getAuthorityRunManifest } from "@/lib/api/architecture-runs";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { signedReviewRecordBlockedReason } from "@/lib/manifest/signed-review-record-blocked-reason";

export function manifestJsonDownloadFileName(runId: string): string {
  const safe = runId.trim().replace(/[^\w.-]+/g, "-");

  return `${safe.length > 0 ? safe : "review"}-manifest.json`;
}

/** Fetches and pretty-prints the committed golden manifest JSON for a review. */
export async function fetchManifestJsonText(runId: string): Promise<string> {
  const trimmedRunId = runId.trim();

  if (trimmedRunId.length === 0) {
    throw new Error("Review id is missing — refresh the page and try again.");
  }

  try {
    const manifestJson = await getAuthorityRunManifest(trimmedRunId);

    return JSON.stringify(manifestJson, null, 2);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = signedReviewRecordBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(error));
  }
}
