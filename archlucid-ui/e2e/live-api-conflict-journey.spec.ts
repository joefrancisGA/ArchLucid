/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test -c playwright.live.config.ts
 */
import { expect, test } from "@playwright/test";

import {
  commitRun,
  commitRunRaw,
  createRun,
  executeRun,
  getRunDetailsWithTransientRetries,
  liveApiBase,
  searchAudit,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

const liveConflictForensics: { runId?: string } = {};

function readProblemType(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  const o = body as Record<string, unknown>;
  const t = o.type ?? o.Type;

  return typeof t === "string" ? t : "";
}

function readCorrelationId(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  const o = body as Record<string, unknown>;
  const c = o.correlationId ?? o.CorrelationId;

  return typeof c === "string" ? c : "";
}

function countAuditByType(events: { eventType?: string }[], eventType: string): number {
  return events.filter((e) => e.eventType === eventType).length;
}

test.describe("live-api-conflict-journey", () => {
  test.afterAll(() => {
    if (liveConflictForensics.runId) {
      console.log(`[live-api-conflict-journey] runId=${liveConflictForensics.runId}`);
    }
  });

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("commit conflict returns 409 and UI still renders committed run", async ({ page, request }) => {
    test.setTimeout(120_000);

    const createBody = {
      requestId: `E2E-LIVE-CONFLICT-${Date.now()}`,
      description:
        "Live E2E conflict path: minimal architecture request for double-commit assertion.",
      systemName: "ConflictTest",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const { runId } = await createRun(request, createBody);

    liveConflictForensics.runId = runId;
    test.info().annotations.push({ type: "e2e-run-id", description: runId });

    await executeRun(request, runId);
    await waitForReadyForCommit(request, runId, 90_000);

    await commitRun(request, runId);
    await waitForRunDetailCommitted(request, runId, 60_000);

    const auditAfterFirst = await searchAudit(request, { runId, take: "200" });
    const manifestGenCountAfterFirst = countAuditByType(auditAfterFirst, "ManifestGenerated");

    expect(manifestGenCountAfterFirst, "expected at least one ManifestGenerated after first commit").toBeGreaterThan(0);

    const second = await commitRunRaw(request, runId);

    expect(second.status(), `second commit expected 409, got ${second.status()}`).toBe(409);

    const problemBody: unknown = await second.json();
    const typeUri = readProblemType(problemBody);

    expect(typeUri, "409 problem type should reference #conflict").toContain("#conflict");
    expect(readCorrelationId(problemBody).length).toBeGreaterThan(0);

    const auditAfterSecond = await searchAudit(request, { runId, take: "200" });

    expect(countAuditByType(auditAfterSecond, "ManifestGenerated")).toBe(manifestGenCountAfterFirst);

    await page.goto(`/runs/${runId}`);

    await expect(page.getByRole("heading", { name: "Run detail", level: 2 })).toBeVisible({ timeout: 60_000 });

    const detail = await getRunDetailsWithTransientRetries(request, runId);
    const st = detail.run?.status;

    expect(
      st === 5 || st === "Committed",
      `run should still be Committed after failed second commit, got status ${String(st)}`,
    ).toBe(true);
  });

  test("commit on non-existent run returns 404 with run-not-found problem type", async ({ request }) => {
    test.setTimeout(60_000);

    const fakeRunId = crypto.randomUUID();
    const res = await commitRunRaw(request, fakeRunId);

    expect(res.status(), `expected 404 for missing run, got ${res.status()}`).toBe(404);

    const problemBody: unknown = await res.json();
    const typeUri = readProblemType(problemBody);

    expect(typeUri, "404 problem type should reference #run-not-found").toContain("#run-not-found");
    expect(readCorrelationId(problemBody).length).toBeGreaterThan(0);
  });
});
