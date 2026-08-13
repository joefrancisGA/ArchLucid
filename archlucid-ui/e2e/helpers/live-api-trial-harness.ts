/** Non-production `/v1/e2e/*` harness routes plus tenant trial status reads. */
import type { APIRequestContext, APIResponse } from "@playwright/test";

import { resolveLiveApiBase } from "./live-api-auth";
import {
  liveAcceptHeaders,
  liveE2eHarnessHeaders,
  mergeTenantScope,
  type LiveTenantScopeHeaders,
} from "./live-api-headers";
import { throwIfNotOk } from "./live-api-response";

/** Shape of `GET /v1/tenant/trial-status`. Named so the helper does not repeat the literal twice. */
export type LiveTenantTrialStatusJson = {
  status?: string;
  daysRemaining?: number | null;
  trialRunsUsed?: number;
  trialRunsLimit?: number | null;
  trialSeatsUsed?: number;
  trialSeatsLimit?: number | null;
  trialSampleRunId?: string | null;
  trialWelcomeRunId?: string | null;
  trialExpiresUtc?: string | null;
  firstCommitUtc?: string | null;
  baselineReviewCycleHours?: number | null;
  baselineReviewCycleSource?: string | null;
  baselineReviewCycleCapturedUtc?: string | null;
};

/** POST `/v1/e2e/trial/set-expires` — clock harness (SQL updates `TrialExpiresUtc`). */
export async function postHarnessTrialSetExpires(
  request: APIRequestContext,
  tenantId: string,
  expiresUtcIso: string,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/e2e/trial/set-expires`, {
    headers: liveE2eHarnessHeaders(),
    data: { tenantId, expiresUtc: expiresUtcIso },
  });
}

/** POST `/v1/e2e/billing/simulate-subscription-activated` — invokes billing activator (Stripe-style outcome). */
export async function postHarnessBillingSimulateActivated(
  request: APIRequestContext,
  body: Record<string, unknown>,
): Promise<APIResponse> {
  return request.post(`${resolveLiveApiBase()}/v1/e2e/billing/simulate-subscription-activated`, {
    headers: liveE2eHarnessHeaders(),
    data: body,
  });
}

/** GET `/v1/tenant/trial-status` for the given tenant scope. */
export async function getTenantTrialStatus(
  request: APIRequestContext,
  scope: LiveTenantScopeHeaders,
): Promise<LiveTenantTrialStatusJson> {
  const res = await request.get(`${resolveLiveApiBase()}/v1/tenant/trial-status`, {
    headers: mergeTenantScope(liveAcceptHeaders(), scope),
  });

  await throwIfNotOk(res, "GET /v1/tenant/trial-status");

  return res.json() as Promise<LiveTenantTrialStatusJson>;
}
