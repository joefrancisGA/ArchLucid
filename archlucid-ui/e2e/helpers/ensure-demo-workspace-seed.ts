import type { APIRequestContext } from "@playwright/test";

import { demoWorkspacesFixtureManifest } from "./demo-workspaces-fixture-manifest";
import {
  getAuthorityRunDetailRaw,
  getPilotRunDeltasWithTransientRetries,
  liveApiBase,
  liveJsonHeaders,
} from "./live-api-client";

export type DemoWorkspaceSeedProbe = "A" | "B";

export type EnsureDemoWorkspaceSeedReadyOptions = {
  /** When omitted, both demo workspaces are probed after seed. */
  readonly workspaces?: readonly DemoWorkspaceSeedProbe[];
};

/** Idempotent demo seed plus authority-run probes for merge-blocking `@release-gate` workspace smokes. */
export async function ensureDemoWorkspaceSeedReady(
  request: APIRequestContext,
  options?: EnsureDemoWorkspaceSeedReadyOptions,
): Promise<void> {
  const seed = await request.post(`${liveApiBase}/v1/demo/seed`, {
    headers: liveJsonHeaders(),
    timeout: 120_000,
  });

  if (seed.status() !== 204) {
    throw new Error(`POST /v1/demo/seed expected 204 — ${seed.status()}: ${(await seed.text()).slice(0, 500)}`);
  }

  const requested = new Set<DemoWorkspaceSeedProbe>(options?.workspaces ?? ["A", "B"]);

  const workspaceChecks = [
    {
      probe: "A" as const,
      label: "workspace A product tour",
      runId: demoWorkspacesFixtureManifest.workspaceA.runId,
      scope: {
        tenantId: demoWorkspacesFixtureManifest.defaultTenantId,
        workspaceId: demoWorkspacesFixtureManifest.workspaceA.workspaceId,
        projectId: demoWorkspacesFixtureManifest.workspaceA.projectId,
      },
    },
    {
      probe: "B" as const,
      label: "workspace B regulated scenario",
      runId: demoWorkspacesFixtureManifest.workspaceB.runId,
      scope: {
        tenantId: demoWorkspacesFixtureManifest.defaultTenantId,
        workspaceId: demoWorkspacesFixtureManifest.workspaceB.workspaceId,
        projectId: demoWorkspacesFixtureManifest.workspaceB.projectId,
      },
    },
  ].filter((check) => requested.has(check.probe));

  for (const check of workspaceChecks) {
    const probe = await getAuthorityRunDetailRaw(request, check.runId, check.scope);

    if (!probe.ok()) {
      throw new Error(
        `${check.label}: GET /v1/authority/runs/{runId} expected 200 — ${probe.status()}: ${(await probe.text()).slice(0, 500)}`,
      );
    }

    const deltas = await getPilotRunDeltasWithTransientRetries(request, check.runId, check.scope);

    if (!deltas.ok()) {
      throw new Error(
        `${check.label}: GET /v1/pilots/runs/{runId}/pilot-run-deltas expected 200 — ${deltas.status()}: ${(await deltas.text()).slice(0, 500)}`,
      );
    }
  }
}
