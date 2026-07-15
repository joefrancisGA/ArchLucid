import {
  applyCorrelationHeaders,
  ensureOidcBearerReady,
  resolveRequest,
  throwApiRequestError,
} from "@/lib/api/http";
import {
  fetchBackgroundJobResultJson,
  waitForBackgroundJobTerminal,
  type BackgroundJobInfo,
} from "@/lib/api/background-jobs-api";
import { BACKGROUND_JOB_STATE } from "@/lib/background-job-state";
import type { components } from "@/lib/openapi-schemas";

export type CreateItsmOutboundIssueResponse = components["schemas"]["CreateItsmOutboundIssueResponse"];

/** TB-394 async job result file shape (OpenAPI snapshot pending regen). */
export type ItsmOutboundCreateJobResult = {
  kind?: string;
  provider?: string;
  externalKey?: string | null;
  userMessage?: string | null;
  vendorStatusCode?: number | null;
};

function mapJobResultToResponse(result: ItsmOutboundCreateJobResult): CreateItsmOutboundIssueResponse {
  if (result.kind !== "Succeeded") {
    throw new Error(result.userMessage ?? "ITSM create did not succeed.");
  }

  return {
    provider: result.provider ?? "ITSM",
    externalKey: result.externalKey ?? null,
  };
}

async function postOutboundCreateRequest(
  findingId: string,
  provider: "Jira" | "ServiceNow" | "Azure Boards",
): Promise<{ status: number; body: unknown }> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest("/v1/integrations/itsm/outbound/issues");
  const { headers: h, correlationId } = applyCorrelationHeaders(headers);
  h.set("Content-Type", "application/json");

  const response = await fetch(
    url,
    {
      method: "POST",
      headers: h,
      body: JSON.stringify({ findingId, provider }),
    },
  );

  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  const body = text.length > 0 ? (JSON.parse(text) as unknown) : null;

  return { status: response.status, body };
}

/** Creates a linked ITSM issue — polls the background job when the API returns 202 (TB-394). */
export async function createItsmOutboundIssueWithJobPolling(
  findingId: string,
  provider: "Jira" | "ServiceNow" | "Azure Boards",
  onJobPending?: (job: BackgroundJobInfo) => void,
): Promise<CreateItsmOutboundIssueResponse> {
  const { status, body } = await postOutboundCreateRequest(findingId, provider);

  if (status === 200) {
    return body as CreateItsmOutboundIssueResponse;
  }

  const jobId = (body as { jobId?: string }).jobId;

  if (!jobId) {
    throw new Error("ITSM create accepted but no job id was returned.");
  }

  const terminal = await waitForBackgroundJobTerminal(jobId, { pollIntervalMs: 400, timeoutMs: 60_000 });

  if (onJobPending && terminal.state === BACKGROUND_JOB_STATE.Running) {
    onJobPending(terminal);
  }

  if (terminal.state === BACKGROUND_JOB_STATE.Failed) {
    throw new Error(terminal.error ?? "ITSM create job failed.");
  }

  const result = await fetchBackgroundJobResultJson<ItsmOutboundCreateJobResult>(jobId);

  return mapJobResultToResponse(result);
}
