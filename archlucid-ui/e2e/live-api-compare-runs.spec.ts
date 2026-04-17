/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test
 */
import { expect, test, type APIResponse } from "@playwright/test";

import {
  commitRun,
  compareAuthorityRuns,
  createRun,
  executeRun,
  liveApiBase,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

function buildCreateBody(suffix: string): Record<string, unknown> {
  return {
    requestId: `E2E-CMP-${suffix}-${Date.now()}`,
    description:
      "Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.",
    systemName: `EnterpriseRag${suffix}`,
    environment: "prod",
    cloudProvider: 1,
    constraints: ["Private endpoints required", "Use managed identity"],
    requiredCapabilities: ["Azure AI Search", "SQL", "Managed Identity", "Private Networking"],
    assumptions: [] as string[],
    priorManifestVersion: null as string | null,
  };
}

test.describe("live-api-compare-runs", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("two committed runs → authority compare → compare page loads", async ({ page, request }) => {
    test.setTimeout(240_000);

    const { runId: runIdA } = await createRun(request, buildCreateBody("A"));
    await executeRun(request, runIdA);
    await waitForReadyForCommit(request, runIdA, 90_000);
    await commitRun(request, runIdA);
    await waitForRunDetailCommitted(request, runIdA, 60_000);

    const { runId: runIdB } = await createRun(request, buildCreateBody("B"));
    await executeRun(request, runIdB);
    await waitForReadyForCommit(request, runIdB, 90_000);
    await commitRun(request, runIdB);
    await waitForRunDetailCommitted(request, runIdB, 60_000);

    test.info().annotations.push(
      { type: "run-id-a", description: runIdA },
      { type: "run-id-b", description: runIdB },
    );

    const compareRes = await compareAuthorityRuns(request, runIdA, runIdB);

    await throwIfNotCompareOk(compareRes, "GET /v1/authority/compare/runs");

    const body = (await compareRes.json()) as {
      leftRunId?: string;
      rightRunId?: string;
      runLevelDiffCount?: number;
      hasManifestComparison?: boolean;
    };

    expect(body.leftRunId).toBeTruthy();
    expect(body.rightRunId).toBeTruthy();
    expect(typeof body.runLevelDiffCount).toBe("number");

    await page.goto(`/compare?leftRunId=${encodeURIComponent(runIdA)}&rightRunId=${encodeURIComponent(runIdB)}`);

    await expect(page.getByRole("heading", { name: /compare runs/i }).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test("compare with missing right run returns 404", async ({ request }) => {
    test.setTimeout(120_000);

    const { runId: runIdA } = await createRun(request, buildCreateBody("404A"));
    await executeRun(request, runIdA);
    await waitForReadyForCommit(request, runIdA, 90_000);
    await commitRun(request, runIdA);

    const fakeRight = "00000000000000000000000000000000";
    const res = await compareAuthorityRuns(request, runIdA, fakeRight);

    expect(res.status()).toBe(404);
  });
});

async function throwIfNotCompareOk(res: APIResponse, label: string): Promise<void> {
  if (res.ok()) {
    return;
  }

  const text = await res.text();

  throw new Error(`${label} failed ${res.status()}: ${text.slice(0, 500)}`);
}
