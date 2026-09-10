import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { runExportBlobPushMutationBlockedReason } from "@/lib/runs/run-export-blob-push-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { apiPostAcceptedWithLocation } from "@/lib/api/http";

export type PushRunExportToBlobRequest = {
  readonly destinationSasUrl: string;
};

/** Enqueues a durable run export ZIP push to a customer-provided Azure Blob SAS URL (HTTP 202). */
export async function pushRunExportToBlob(
  runId: string,
  body: PushRunExportToBlobRequest,
): Promise<{ readonly location: string | null; readonly status: number }> {
  try {
    return await apiPostAcceptedWithLocation(
      `/v1/artifacts/runs/${encodeURIComponent(runId)}/export/push`,
      { destinationSasUrl: body.destinationSasUrl },
      { suppressErrorToast: true },
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = runExportBlobPushMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
