import { apiGet, ensureOidcBearerReady, resolveRequest, throwApiRequestError, withCorrelationHeaders } from "@/lib/api/http";
import type { components } from "@/lib/openapi-schemas";

export type BackgroundJobInfo = components["schemas"]["BackgroundJobInfo"];
export type BackgroundJobState = NonNullable<BackgroundJobInfo["state"]>;

export async function fetchBackgroundJob(jobId: string): Promise<BackgroundJobInfo> {
  return apiGet<BackgroundJobInfo>(`/v1/jobs/${encodeURIComponent(jobId)}`);
}

export async function fetchBackgroundJobResultJson<T>(jobId: string): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = resolveRequest(`/v1/jobs/${encodeURIComponent(jobId)}/file`);
  const { headers: h, correlationId } = withCorrelationHeaders(headers);

  const response = await fetch(url, { method: "GET", headers: h });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  return JSON.parse(text) as T;
}

export async function waitForBackgroundJobTerminal(
  jobId: string,
  options?: { readonly pollIntervalMs?: number; readonly timeoutMs?: number },
): Promise<BackgroundJobInfo> {
  const pollIntervalMs = options?.pollIntervalMs ?? 400;
  const timeoutMs = options?.timeoutMs ?? 30_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const info = await fetchBackgroundJob(jobId);

    if (info.state === "Succeeded" || info.state === "Failed") {
      return info;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, pollIntervalMs);
    });
  }

  throw new Error(`Background job ${jobId} did not complete within ${timeoutMs}ms.`);
}
