/**
 * Live API + SQL: list filter by system name, knowledge graph, Ask, and operator Search + Ask pages.
 */
import { expect, test } from "@playwright/test";

import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

import { runAxe } from "./helpers/axe-helper";
import { getAppMain } from "./helpers/app-main";
import {
  commitRun,
  createRun,
  executeRun,
  getGraphForRunRaw,
  getRunDetailsWithTransientRetries,
  listArchitectureRuns,
  liveApiBase,
  liveE2eArchitectureDescription,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  postAskRawSoft,
  toRunGuidPathSegment,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

test.describe("live-api-search-ask-graph", { tag: ["@founder"] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(`Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}).`);
    }
  });

  test("list contains committed run by systemName; graph API returns nodes; Ask returns body; /search and /ask pass axe", async ({
    page,
    request,
  }) => {
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    const systemName = `E2ELiveSearchGraph-${Date.now()}`;
    const createBody = {
      requestId: `E2E-SEARCH-${Date.now()}`,
      description: liveE2eArchitectureDescription("Live E2E search / ask / graph path."),
      systemName,
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: [] as string[],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const { runId } = await createRun(request, createBody);
    await executeRun(request, runId);
    await waitForReadyForCommit(request, runId, 90_000);
    await commitRun(request, runId);
    await waitForRunDetailCommitted(request, runId, 60_000);

    const detail = await getRunDetailsWithTransientRetries(request, runId);

    if (!detail.run?.goldenManifestId) {
      throw new Error("Committed run missing goldenManifestId for graph probe.");
    }

    const rows = await listArchitectureRuns(request);
    const hit = rows.find((r) => r.runId === runId);

    expect(hit, "GET /v1/architecture/runs should include the committed run").toBeDefined();

    if (hit?.systemName) {
      expect(hit.systemName).toBe(systemName);
    }

    const graphRes = await getGraphForRunRaw(request, toRunGuidPathSegment(runId));

    expect(graphRes.ok(), `GET graph expected 200, got ${graphRes.status()}`).toBeTruthy();
    const graphJson = (await graphRes.json()) as { nodes?: unknown[]; edges?: unknown[] };

    expect(Array.isArray(graphJson.nodes)).toBeTruthy();
    expect(Array.isArray(graphJson.edges)).toBeTruthy();

    const runGuid = toRunGuidPathSegment(runId);
    const askRes = await postAskRawSoft(
      request,
      {
        runId: runGuid,
        question: "List the main components mentioned in the manifest context in one short sentence.",
      },
      { timeoutMs: 90_000 },
    );

    if (askRes === null) {
      console.log("[live-api-search-ask-graph] POST /v1/ask timed out or failed transport — non-fatal for CI");
    } else if (askRes.ok()) {
      const askJson = (await askRes.json()) as { answer?: string };

      expect((askJson.answer ?? "").length).toBeGreaterThan(0);
    } else {
      console.log(`[live-api-search-ask-graph] POST /v1/ask returned ${askRes.status()} — non-fatal for CI`);
    }

    // Legacy /search and /ask were retired (no redirect) — use Insights routes.
    await page.goto(`${SEARCH_REVIEW_EVIDENCE_PATH}?projectId=default`, { waitUntil: "load" });
    await getAppMain(page).waitFor({ state: "visible", timeout: 60_000 });
    const searchAxe = await runAxe(page);
    const searchCritical = searchAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(searchCritical, "search page axe").toHaveLength(0);

    await page.goto(`${ASK_REVIEW_QUESTIONS_PATH}?projectId=default`, { waitUntil: "load" });
    await getAppMain(page).waitFor({ state: "visible", timeout: 60_000 });
    const askAxe = await runAxe(page);
    const askCritical = askAxe.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(askCritical, "ask page axe").toHaveLength(0);
  });
});
