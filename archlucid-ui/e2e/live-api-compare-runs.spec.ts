/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test
 */
import { expect, test, type APIResponse } from "@playwright/test";

import { injectDemoWorkspaceOperatorScope } from "./helpers/demo-workspace-live-scope";
import {
  commitRun,
  compareAuthorityRuns,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  liveApiBase,
  waitForAuthorityRunSummaryReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";
import { comparePageMainHeading, comparisonRequestOutcomePanel } from "./helpers/operator-journey";

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

test.describe("live-api-compare-runs", { tag: ["@founder"] }, () => {
  const tenantScope = freshIsolatedTenantScope();

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("two committed runs → authority compare → compare page loads", async ({ page, request }) => {
    // Two execute/commit cycles plus compare UI hydration can exceed 240s in CI (see live-api-journey timeout note).
    test.setTimeout(480_000);

    const { runId: runIdA } = await createRun(request, buildCreateBody("A"), tenantScope);
    await executeRun(request, runIdA, tenantScope);
    await waitForReadyForCommit(request, runIdA, 90_000, tenantScope);
    await commitRun(request, runIdA, tenantScope);
    await waitForRunDetailCommitted(request, runIdA, 60_000, tenantScope);

    const { runId: runIdB } = await createRun(request, buildCreateBody("B"), tenantScope);
    await executeRun(request, runIdB, tenantScope);
    await waitForReadyForCommit(request, runIdB, 90_000, tenantScope);
    await commitRun(request, runIdB, tenantScope);
    await waitForRunDetailCommitted(request, runIdB, 60_000, tenantScope);

    await waitForAuthorityRunSummaryReady(request, runIdA, 60_000, tenantScope);
    await waitForAuthorityRunSummaryReady(request, runIdB, 60_000, tenantScope);

    test.info().annotations.push(
      { type: "run-id-a", description: runIdA },
      { type: "run-id-b", description: runIdB },
    );

    const compareRes = await compareAuthorityRuns(request, runIdA, runIdB, tenantScope);

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

    await injectDemoWorkspaceOperatorScope(page, tenantScope);
    await page.goto(`/insights/compare-two-reviews?leftRunId=${encodeURIComponent(runIdA)}&rightRunId=${encodeURIComponent(runIdB)}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(comparePageMainHeading(page).first()).toBeVisible({ timeout: 60_000 });

    await expect(page.locator("#compare-structured")).toBeVisible({ timeout: 120_000 });

    await expect(comparisonRequestOutcomePanel(page)).toBeVisible({ timeout: 60_000 });
  });

  test("compare with missing right run returns 404", async ({ request }) => {
    test.setTimeout(240_000);

    const { runId: runIdA } = await createRun(request, buildCreateBody("404A"), tenantScope);
    await executeRun(request, runIdA, tenantScope);
    await waitForReadyForCommit(request, runIdA, 90_000, tenantScope);
    await commitRun(request, runIdA, tenantScope);

    const fakeRight = "00000000000000000000000000000000";
    const res = await compareAuthorityRuns(request, runIdA, fakeRight, tenantScope);

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
