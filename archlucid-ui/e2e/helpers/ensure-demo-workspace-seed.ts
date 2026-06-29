import type { APIRequestContext } from "@playwright/test";

import { demoWorkspacesFixtureManifest } from "./demo-workspaces-fixture-manifest";
import {
  getAuthorityRunDetailRaw,
  liveApiBase,
  liveJsonHeaders,
} from "./live-api-client";

/** Idempotent demo seed plus authority-run probes for merge-blocking `@release-gate` workspace smokes. */
export async function ensureDemoWorkspaceSeedReady(request: APIRequestContext): Promise<void> {
  const seed = await request.post(`${liveApiBase}/v1/demo/seed`, {
    headers: liveJsonHeaders(),
    timeout: 120_000,
  });

  if (seed.status() !== 204) {
    throw new Error(`POST /v1/demo/seed expected 204 — ${seed.status()}: ${(await seed.text()).slice(0, 500)}`);
  }

  const workspaceChecks = [
    {
      label: "workspace A product tour",
      runId: demoWorkspacesFixtureManifest.workspaceA.runId,
      scope: {
        tenantId: demoWorkspacesFixtureManifest.defaultTenantId,
        workspaceId: demoWorkspacesFixtureManifest.workspaceA.workspaceId,
        projectId: demoWorkspacesFixtureManifest.workspaceA.projectId,
      },
    },
    {
      label: "workspace B regulated scenario",
      runId: demoWorkspacesFixtureManifest.workspaceB.runId,
      scope: {
        tenantId: demoWorkspacesFixtureManifest.defaultTenantId,
        workspaceId: demoWorkspacesFixtureManifest.workspaceB.workspaceId,
        projectId: demoWorkspacesFixtureManifest.workspaceB.projectId,
      },
    },
  ] as const;

  for (const check of workspaceChecks) {
    const probe = await getAuthorityRunDetailRaw(request, check.runId, check.scope);

    if (!probe.ok()) {
      throw new Error(
        `${check.label}: GET /v1/authority/runs/{runId} expected 200 — ${await probe.text()}`,
      );
    }
  }
}
