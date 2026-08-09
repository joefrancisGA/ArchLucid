import type { APIRequestContext } from "@playwright/test";

import { demoWorkspacesFixtureManifest } from "./demo-workspaces-fixture-manifest";
import {
  getAuthorityBuyerSummaryRaw,
  getAuthorityRunDetailRaw,
  getAuthorityRunDetailWithTransientRetries,
  getPilotRunDeltasRaw,
  getPilotRunDeltasWithTransientRetries,
  liveE2eCommitWaitMs,
  liveJsonHeaders,
  resolveLiveApiBase,
  type LiveTenantScopeHeaders,
} from "./live-api-client";

export type DemoWorkspaceSeedProbe = "A" | "B";

export type EnsureDemoWorkspaceSeedReadyOptions = {
  /** When omitted, both demo workspaces are probed after seed. */
  readonly workspaces?: readonly DemoWorkspaceSeedProbe[];
};

type DemoWorkspaceSeedCheck = {
  readonly probe: DemoWorkspaceSeedProbe;
  readonly label: string;
  readonly runId: string;
  readonly scope: LiveTenantScopeHeaders;
};

const maxDemoSeedPostAttempts = 12;

const demoSeedConvergencePollIntervalMs = 2_000;

const demoSeedProbeRetryOptions = { retryRunNotFound: true } as const;

async function sleepSeedBackoff(attempt: number): Promise<void> {
  const baseDelayMs = Math.min(1000 * 2 ** attempt, 8000);
  const jitterMs = Math.floor(Math.random() * 250);

  await new Promise((resolve) => setTimeout(resolve, baseDelayMs + jitterMs));
}

export async function postDemoSeedWithTransientRetries(request: APIRequestContext): Promise<void> {
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt < maxDemoSeedPostAttempts; attempt++) {
    try {
      const seed = await request.post(`${resolveLiveApiBase()}/v1/demo/seed`, {
        headers: liveJsonHeaders(),
        timeout: 120_000,
      });

      if (seed.status() === 204) {
        return;
      }

      lastStatus = seed.status();
      lastBody = (await seed.text()).slice(0, 500);

      if (lastStatus >= 500 && lastStatus < 600 && attempt < maxDemoSeedPostAttempts - 1) {
        await sleepSeedBackoff(attempt);

        continue;
      }

      throw new Error(`POST /v1/demo/seed expected 204 — ${lastStatus}: ${lastBody}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const transportBlip =
        /ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|socket hang up|request context.*disposed|Failed to connect/i.test(
          message,
        );

      if (transportBlip && attempt < maxDemoSeedPostAttempts - 1) {
        await sleepSeedBackoff(attempt);

        continue;
      }

      throw error;
    }
  }

  throw new Error(`POST /v1/demo/seed expected 204 — ${lastStatus}: ${lastBody}`);
}

function buildWorkspaceChecks(requested: ReadonlySet<DemoWorkspaceSeedProbe>): DemoWorkspaceSeedCheck[] {
  return [
    {
      probe: "A",
      label: "workspace A product tour",
      runId: demoWorkspacesFixtureManifest.workspaceA.runId,
      scope: {
        tenantId: demoWorkspacesFixtureManifest.defaultTenantId,
        workspaceId: demoWorkspacesFixtureManifest.workspaceA.workspaceId,
        projectId: demoWorkspacesFixtureManifest.workspaceA.projectId,
      },
    },
    {
      probe: "B",
      label: "workspace B regulated scenario",
      runId: demoWorkspacesFixtureManifest.workspaceB.runId,
      scope: {
        tenantId: demoWorkspacesFixtureManifest.defaultTenantId,
        workspaceId: demoWorkspacesFixtureManifest.workspaceB.workspaceId,
        projectId: demoWorkspacesFixtureManifest.workspaceB.projectId,
      },
    },
  ].filter((check) => requested.has(check.probe));
}

async function isDemoWorkspaceSeedCheckReady(
  request: APIRequestContext,
  check: DemoWorkspaceSeedCheck,
): Promise<boolean> {
  const authority = await getAuthorityRunDetailRaw(request, check.runId, check.scope);

  if (!authority.ok()) {
    return false;
  }

  // SSR buyer shell loads `/buyer-summary`, not the full authority detail envelope.
  const buyerSummary = await getAuthorityBuyerSummaryRaw(request, check.runId, check.scope);

  if (!buyerSummary.ok()) {
    return false;
  }

  const deltas = await getPilotRunDeltasRaw(request, check.runId, check.scope);

  return deltas.ok();
}

async function assertDemoWorkspaceSeedCheckReady(
  request: APIRequestContext,
  check: DemoWorkspaceSeedCheck,
): Promise<void> {
  const probe = await getAuthorityRunDetailWithTransientRetries(
    request,
    check.runId,
    check.scope,
    demoSeedProbeRetryOptions,
  );

  if (!probe.ok()) {
    throw new Error(
      `${check.label}: GET /v1/authority/reviews/{runId} expected 200 — ${probe.status()}: ${(await probe.text()).slice(0, 500)}`,
    );
  }

  const buyerSummary = await getAuthorityBuyerSummaryRaw(request, check.runId, check.scope);

  if (!buyerSummary.ok()) {
    throw new Error(
      `${check.label}: GET /v1/authority/reviews/{runId}/buyer-summary expected 200 — ${buyerSummary.status()}: ${(await buyerSummary.text()).slice(0, 500)}`,
    );
  }

  const deltas = await getPilotRunDeltasWithTransientRetries(
    request,
    check.runId,
    check.scope,
    demoSeedProbeRetryOptions,
  );

  if (!deltas.ok()) {
    throw new Error(
      `${check.label}: GET /v1/pilots/runs/{runId}/pilot-run-deltas expected 200 — ${deltas.status()}: ${(await deltas.text()).slice(0, 500)}`,
    );
  }
}

async function areAllDemoWorkspaceSeedChecksReady(
  request: APIRequestContext,
  workspaceChecks: readonly DemoWorkspaceSeedCheck[],
): Promise<boolean> {
  const readiness = await Promise.all(
    workspaceChecks.map(async (check) => isDemoWorkspaceSeedCheckReady(request, check)),
  );

  return readiness.every(Boolean);
}

async function waitForDemoWorkspaceSeedConvergence(
  request: APIRequestContext,
  workspaceChecks: readonly DemoWorkspaceSeedCheck[],
): Promise<void> {
  const deadline = Date.now() + liveE2eCommitWaitMs(90_000);
  let seedPosted = false;

  while (Date.now() < deadline) {
    if (await areAllDemoWorkspaceSeedChecksReady(request, workspaceChecks)) {
      return;
    }

    if (!seedPosted) {
      await postDemoSeedWithTransientRetries(request);
      seedPosted = true;

      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, demoSeedConvergencePollIntervalMs));
  }

  for (const check of workspaceChecks) {
    await assertDemoWorkspaceSeedCheckReady(request, check);
  }
}

/** Idempotent demo seed plus authority-run probes for merge-blocking `@release-gate` workspace smokes. */
export async function ensureDemoWorkspaceSeedReady(
  request: APIRequestContext,
  options?: EnsureDemoWorkspaceSeedReadyOptions,
): Promise<void> {
  const requested = new Set<DemoWorkspaceSeedProbe>(options?.workspaces ?? ["A", "B"]);
  const workspaceChecks = buildWorkspaceChecks(requested);

  await waitForDemoWorkspaceSeedConvergence(request, workspaceChecks);
}
