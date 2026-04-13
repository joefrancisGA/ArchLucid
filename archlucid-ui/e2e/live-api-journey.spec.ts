import { expect, test } from "@playwright/test";

const liveApiBase = process.env.LIVE_API_URL ?? "http://127.0.0.1:5128";

test.describe("live-api-journey", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("operator shell against real API: runs, audit RunStarted, governance", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const createBody = {
      requestId: `E2E-LIVE-${Date.now()}`,
      description:
        "Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.",
      systemName: "EnterpriseRag",
      environment: "prod",
      cloudProvider: 1,
      constraints: ["Private endpoints required", "Use managed identity"],
      requiredCapabilities: ["Azure AI Search", "SQL", "Managed Identity", "Private Networking"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const createRes = await request.post(`${liveApiBase}/v1/architecture/request`, {
      data: createBody,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });

    if (!createRes.ok()) {
      const text = await createRes.text();

      throw new Error(`POST /v1/architecture/request failed ${createRes.status()}: ${text.slice(0, 500)}`);
    }

    const created = (await createRes.json()) as { run?: { runId?: string } };
    const runId = created.run?.runId;

    if (!runId) {
      throw new Error("Create run response missing run.runId");
    }

    const execRes = await request.post(`${liveApiBase}/v1/architecture/run/${runId}/execute`, {
      headers: { Accept: "application/json" },
    });

    if (!execRes.ok()) {
      const text = await execRes.text();

      throw new Error(`POST execute failed ${execRes.status()}: ${text.slice(0, 500)}`);
    }

    await page.goto("/runs");

    await expect(page.getByRole("heading", { name: /runs/i }).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/runs/${runId}`);

    await expect(page.getByText(/run|status|manifest/i).first()).toBeVisible({ timeout: 60_000 });

    const auditApi = await request.get(`${liveApiBase}/v1/audit/search`, {
      params: { runId, take: "50" },
    });

    if (!auditApi.ok()) {
      const body = await auditApi.text();

      throw new Error(`GET /v1/audit/search failed ${auditApi.status()}: ${body.slice(0, 400)}`);
    }

    await page.goto("/audit");

    await expect(page.getByRole("heading", { name: /audit log/i })).toBeVisible({ timeout: 30_000 });

    await page.getByLabel(/run id/i).fill(runId);
    await page.getByRole("button", { name: /^Search$/i }).click();

    await expect(page.locator('[role="alert"]').filter({ hasText: /problem|error|failed/i })).toHaveCount(0, {
      timeout: 60_000,
    });

    await page.goto("/governance");

    await expect(page.getByRole("heading", { name: /governance workflow/i })).toBeVisible({
      timeout: 60_000,
    });
  });
});
