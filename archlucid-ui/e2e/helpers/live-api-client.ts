/**
 * Typed helpers for Playwright live-API E2E against ArchLucid.Api
 * (`live-api-journey.spec.ts`, `live-api-conflict-journey.spec.ts`, `live-api-governance-rejection.spec.ts`, …).
 */
import type { APIRequestContext, APIResponse } from "@playwright/test";

/** Base URL for ArchLucid.Api (e.g. http://127.0.0.1:5128). */
export const liveApiBase = process.env.LIVE_API_URL ?? "http://127.0.0.1:5128";

const jsonHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

async function throwIfNotOk(res: APIResponse, label: string): Promise<void> {
  if (res.ok()) {
    return;
  }

  const text = await res.text();
  const snippet = text.slice(0, 500);

  throw new Error(`${label} failed ${res.status()}: ${snippet}`);
}

/** POST `/v1/architecture/request` — create a new architecture run. */
export async function createRun(
  request: APIRequestContext,
  body: Record<string, unknown>,
): Promise<{ runId: string }> {
  const res = await request.post(`${liveApiBase}/v1/architecture/request`, {
    data: body,
    headers: jsonHeaders,
  });

  await throwIfNotOk(res, "POST /v1/architecture/request");

  const created = (await res.json()) as { run?: { runId?: string } };
  const runId = created.run?.runId;

  if (!runId) {
    throw new Error("Create run response missing run.runId");
  }

  return { runId };
}

/** POST `/v1/architecture/run/{runId}/execute` — run agents (Simulator in CI). */
export async function executeRun(request: APIRequestContext, runId: string): Promise<unknown> {
  const res = await request.post(`${liveApiBase}/v1/architecture/run/${runId}/execute`, {
    headers: { Accept: "application/json" },
  });

  await throwIfNotOk(res, "POST /v1/architecture/run/.../execute");

  return res.json();
}

/** POST `/v1/architecture/run/{runId}/commit` — merge and persist golden manifest. */
export async function commitRun(request: APIRequestContext, runId: string): Promise<CommitRunResponseJson> {
  const res = await request.post(`${liveApiBase}/v1/architecture/run/${runId}/commit`, {
    headers: { Accept: "application/json" },
  });

  await throwIfNotOk(res, "POST /v1/architecture/run/.../commit");

  return res.json() as Promise<CommitRunResponseJson>;
}

/** Same as {@link commitRun} but returns the raw response for negative-path assertions (409, 404, …). */
export async function commitRunRaw(request: APIRequestContext, runId: string): Promise<APIResponse> {
  return request.post(`${liveApiBase}/v1/architecture/run/${runId}/commit`, {
    headers: { Accept: "application/json" },
  });
}

/** Minimal commit response shape for E2E (camelCase JSON). */
export type CommitRunResponseJson = {
  manifest?: {
    metadata?: { manifestVersion?: string };
  };
};

/** GET `/v1/architecture/run/{runId}` — run aggregate including golden manifest id after commit. */
export async function getRunDetails(request: APIRequestContext, runId: string): Promise<RunDetailsJson> {
  const res = await request.get(`${liveApiBase}/v1/architecture/run/${runId}`, {
    headers: { Accept: "application/json" },
  });

  await throwIfNotOk(res, "GET /v1/architecture/run/...");

  return res.json() as Promise<RunDetailsJson>;
}

const maxTransientRetriesPerPoll = 3;

/**
 * Same as {@link getRunDetails} but retries a few times on HTTP 5xx (transient API/SQL blips during polling).
 */
export async function getRunDetailsWithTransientRetries(
  request: APIRequestContext,
  runId: string,
): Promise<RunDetailsJson> {
  for (let attempt = 0; attempt <= maxTransientRetriesPerPoll; attempt++) {
    const res = await request.get(`${liveApiBase}/v1/architecture/run/${runId}`, {
      headers: { Accept: "application/json" },
    });
    const code = res.status();

    if (code >= 500 && code < 600 && attempt < maxTransientRetriesPerPoll) {
      await new Promise((r) => setTimeout(r, 500));

      continue;
    }

    await throwIfNotOk(res, "GET /v1/architecture/run/...");

    return res.json() as Promise<RunDetailsJson>;
  }

  throw new Error("getRunDetailsWithTransientRetries: retry loop exhausted");
}

/**
 * Polls GET run detail until status is ReadyForCommit (4), Committed (5), or timeout.
 * Throws if the run reaches Failed (6) first.
 */
export async function waitForReadyForCommit(
  request: APIRequestContext,
  runId: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const detail = await getRunDetailsWithTransientRetries(request, runId);
    const status = detail.run?.status;

    if (status === 4 || status === "ReadyForCommit") {
      return;
    }

    if (status === 5 || status === "Committed") {
      return;
    }

    if (status === 6 || status === "Failed") {
      throw new Error(`Run ${runId} reached Failed before ReadyForCommit`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error(`Run ${runId} did not reach ReadyForCommit within ${timeoutMs}ms`);
}

/** Row from `GET /v1/architecture/runs` (coordinator list). */
export type ArchitectureRunListItemJson = {
  runId?: string;
  status?: string;
  requestId?: string;
  currentManifestVersion?: string | null;
};

/** True when API status is {@link ArchitectureRunStatus.Committed} (numeric 5 or string "Committed"). */
export function isArchitectureRunStatusCommitted(status: number | string | undefined): boolean {
  if (status === undefined || status === null) {
    return false;
  }

  if (typeof status === "number") {
    return status === 5;
  }

  return /^committed$/i.test(String(status).trim());
}

/** Polls GET run detail until status is Committed or timeout (post-commit / read-your-writes). */
export async function waitForRunDetailCommitted(
  request: APIRequestContext,
  runId: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const detail = await getRunDetailsWithTransientRetries(request, runId);

    if (isArchitectureRunStatusCommitted(detail.run?.status)) {
      return;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Run ${runId} did not reach Committed (GET /v1/architecture/run/{id}) within ${timeoutMs}ms`);
}

/** Polls GET /v1/architecture/runs until the row shows Committed or timeout (dashboard list consistency). */
export async function waitForArchitectureRunListCommitted(
  request: APIRequestContext,
  runId: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const rows = await listArchitectureRuns(request);
    const row = rows.find((r) => r.runId === runId);

    if (row !== undefined && isArchitectureRunStatusCommitted(row.status)) {
      return;
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error(`Run ${runId} did not show Committed on GET /v1/architecture/runs within ${timeoutMs}ms`);
}

/** GET `/v1/architecture/runs` — recent runs in scope (dashboard / picker). */
export async function listArchitectureRuns(request: APIRequestContext): Promise<ArchitectureRunListItemJson[]> {
  const res = await request.get(`${liveApiBase}/v1/architecture/runs`, {
    headers: { Accept: "application/json" },
  });

  await throwIfNotOk(res, "GET /v1/architecture/runs");

  return res.json() as Promise<ArchitectureRunListItemJson[]>;
}

/** POST approve without throwing — use for negative-path assertions (`expect.soft` + status/body). */
export async function postGovernanceApproveRaw(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string | null },
): Promise<APIResponse> {
  return request.post(`${liveApiBase}/v1/governance/approval-requests/${approvalRequestId}/approve`, {
    data: {
      reviewedBy: body.reviewedBy,
      reviewComment: body.reviewComment ?? null,
    },
    headers: jsonHeaders,
  });
}

export type RunDetailsJson = {
  run?: {
    goldenManifestId?: string | null;
    /** Numeric enum from API JSON, or string name when serialized as string. */
    status?: number | string;
  };
};

/** POST `/v1/governance/approval-requests` — submit promotion approval request. */
export async function createApprovalRequest(
  request: APIRequestContext,
  body: CreateGovernanceApprovalRequestBody,
): Promise<GovernanceApprovalRequestJson> {
  const res = await request.post(`${liveApiBase}/v1/governance/approval-requests`, {
    data: {
      runId: body.runId,
      manifestVersion: body.manifestVersion,
      sourceEnvironment: body.sourceEnvironment,
      targetEnvironment: body.targetEnvironment,
      requestComment: body.requestComment ?? null,
    },
    headers: jsonHeaders,
  });

  await throwIfNotOk(res, "POST /v1/governance/approval-requests");

  return res.json() as Promise<GovernanceApprovalRequestJson>;
}

export type CreateGovernanceApprovalRequestBody = {
  runId: string;
  manifestVersion: string;
  sourceEnvironment: string;
  targetEnvironment: string;
  requestComment?: string;
};

export type GovernanceApprovalRequestJson = {
  approvalRequestId?: string;
  status?: string;
  runId?: string;
};

/** POST `/v1/governance/approval-requests/{id}/approve`. Use a different `reviewedBy` than the submitter to satisfy segregation of duties. */
export async function approveGovernanceRequest(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string },
): Promise<GovernanceApprovalRequestJson> {
  const res = await request.post(
    `${liveApiBase}/v1/governance/approval-requests/${approvalRequestId}/approve`,
    {
      data: {
        reviewedBy: body.reviewedBy,
        reviewComment: body.reviewComment ?? null,
      },
      headers: jsonHeaders,
    },
  );

  await throwIfNotOk(res, "POST /v1/governance/approval-requests/.../approve");

  return res.json() as Promise<GovernanceApprovalRequestJson>;
}

/** POST `/v1/governance/approval-requests/{id}/reject`. */
export async function rejectGovernanceRequest(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string },
): Promise<GovernanceApprovalRequestJson> {
  const res = await request.post(
    `${liveApiBase}/v1/governance/approval-requests/${approvalRequestId}/reject`,
    {
      data: {
        reviewedBy: body.reviewedBy,
        reviewComment: body.reviewComment ?? null,
      },
      headers: jsonHeaders,
    },
  );

  await throwIfNotOk(res, "POST /v1/governance/approval-requests/.../reject");

  return res.json() as Promise<GovernanceApprovalRequestJson>;
}

/** POST reject without throwing — for negative-path assertions. */
export async function postGovernanceRejectRaw(
  request: APIRequestContext,
  approvalRequestId: string,
  body: { reviewedBy: string; reviewComment?: string | null },
): Promise<APIResponse> {
  return request.post(`${liveApiBase}/v1/governance/approval-requests/${approvalRequestId}/reject`, {
    data: {
      reviewedBy: body.reviewedBy,
      reviewComment: body.reviewComment ?? null,
    },
    headers: jsonHeaders,
  });
}

/** GET `/v1/audit/search` — filtered audit events (`runId` and/or `correlationId` query params). */
export async function searchAudit(
  request: APIRequestContext,
  params: { runId?: string; correlationId?: string; take?: string },
): Promise<AuditEventJson[]> {
  if (!params.runId && !params.correlationId) {
    throw new Error("searchAudit: provide runId and/or correlationId");
  }

  const query: Record<string, string> = { take: params.take ?? "100" };

  if (params.runId) {
    query.runId = params.runId;
  }

  if (params.correlationId) {
    query.correlationId = params.correlationId;
  }

  const res = await request.get(`${liveApiBase}/v1/audit/search`, {
    params: query,
    headers: { Accept: "application/json" },
  });

  await throwIfNotOk(res, "GET /v1/audit/search");

  return res.json() as Promise<AuditEventJson[]>;
}

export type AuditEventJson = {
  eventType?: string;
  correlationId?: string | null;
};

/** GET `/v1/artifacts/runs/{runId}/export` — ZIP of committed run (binary). */
export async function getRunExportZip(request: APIRequestContext, runId: string): Promise<APIResponse> {
  return request.get(`${liveApiBase}/v1/artifacts/runs/${runId}/export`, {
    headers: { Accept: "application/zip, application/octet-stream, */*" },
  });
}
