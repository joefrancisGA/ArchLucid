import {
  apiGet,
  applyCorrelationHeaders,
  ensureOidcBearerReady,
  resolveRequest,
  throwApiRequestError,
} from "@/lib/api/http";
import { BACKGROUND_JOB_STATE } from "@/lib/background-job-state";
import type { components } from "@/lib/openapi-schemas";

export type BackgroundJobInfo = components["schemas"]["BackgroundJobInfo"];
export type BackgroundJobState = NonNullable<BackgroundJobInfo["state"]>;

export async function fetchBackgroundJob(jobId: string): Promise<BackgroundJobInfo> {
  return apiGet<BackgroundJobInfo>(`/v1/jobs/${encodeURIComponent(jobId)}`);
}

export async function fetchBackgroundJobResultJson<T>(jobId: string): Promise<T> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(`/v1/jobs/${encodeURIComponent(jobId)}/file`);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);

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

    if (info.state === BACKGROUND_JOB_STATE.Succeeded || info.state === BACKGROUND_JOB_STATE.Failed) {
      return info;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, pollIntervalMs);
    });
  }

  throw new Error(`Background job ${jobId} did not complete within ${timeoutMs}ms.`);
}
