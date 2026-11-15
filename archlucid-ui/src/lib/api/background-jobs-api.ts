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

function encodeRequiredJobId(jobId: string): string {
  const normalized = jobId.trim();

  if (normalized.length === 0) {
    throw new Error("jobId is required.");
  }

  return encodeURIComponent(normalized);
}

export async function fetchBackgroundJob(jobId: string): Promise<BackgroundJobInfo> {
  return apiGet<BackgroundJobInfo>(`/v1/jobs/${encodeRequiredJobId(jobId)}`);
}

export async function fetchBackgroundJobResultJson<T>(jobId: string): Promise<T> {
  await ensureOidcBearerReady();
  const encodedJobId = encodeRequiredJobId(jobId);
  const { url, headers } = await resolveRequest(`/v1/jobs/${encodedJobId}/file`);
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);

  const response = await fetch(url, { method: "GET", headers: h });
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Background job result was not valid JSON.");
  }
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
