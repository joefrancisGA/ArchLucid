import { apiPostAcceptedWithLocation } from "@/lib/api/http";

export type PushRunExportToBlobRequest = {
  readonly destinationSasUrl: string;
};

/** Enqueues a durable run export ZIP push to a customer-provided Azure Blob SAS URL (HTTP 202). */
export async function pushRunExportToBlob(
  runId: string,
  body: PushRunExportToBlobRequest,
): Promise<{ readonly location: string | null; readonly status: number }> {
  return apiPostAcceptedWithLocation(
    `/v1/artifacts/runs/${encodeURIComponent(runId)}/export/push`,
    { destinationSasUrl: body.destinationSasUrl },
    { suppressErrorToast: true },
  );
}
