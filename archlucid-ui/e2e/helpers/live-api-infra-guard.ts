import type { APIRequestContext } from "@playwright/test";

import { isDatabaseUnavailablePayload } from "./live-api-infra-retry";
import { resolveLiveApiBase } from "./live-api-client";

export type LiveApiInfrastructureProbeResult = {
  readonly ready: boolean;
  readonly reason?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cheap readiness probe: `/health/ready` plus a scoped authority list read that fails fast when SQL is down.
 * Used by the live Playwright setup project to fail once instead of mass commit retries across the suite.
 */
export async function probeLiveApiInfrastructureReady(
  request: APIRequestContext,
  options?: { maxAttempts?: number; delayMs?: number },
): Promise<LiveApiInfrastructureProbeResult> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const delayMs = options?.delayMs ?? 2000;
  const base = resolveLiveApiBase();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const health = await request.get(`${base}/health/ready`, { timeout: 20_000 });

      if (!health.ok()) {
        const healthBody = await health.text();

        if (attempt < maxAttempts - 1) {
          await sleep(delayMs);

          continue;
        }

        return {
          ready: false,
          reason: `GET /health/ready returned ${health.status()}: ${healthBody.slice(0, 300)}`,
        };
      }

      const runs = await request.get(`${base}/v1/authority/projects/default/reviews?page=1&pageSize=1`, {
        headers: { Accept: "application/json" },
        timeout: 20_000,
      });
      const runsStatus = runs.status();
      const runsBody = await runs.text();

      if (runsStatus >= 500 || isDatabaseUnavailablePayload(runsBody)) {
        if (attempt < maxAttempts - 1) {
          await sleep(delayMs);

          continue;
        }

        return {
          ready: false,
          reason: `DB-backed authority list probe failed ${runsStatus}: ${runsBody.slice(0, 300)}`,
        };
      }

      return { ready: true };
    } catch (error: unknown) {
      if (attempt < maxAttempts - 1) {
        await sleep(delayMs);

        continue;
      }

      const message = error instanceof Error ? error.message : String(error);

      return { ready: false, reason: `Live API infrastructure probe failed: ${message}` };
    }
  }

  return { ready: false, reason: "Live API infrastructure probe exhausted attempts" };
}
