/**
 * Workspace B (Meridian / Alpine regulated storyline) — SQL-backed Development seed (`docs/go-to-market/DEMO_WORKSPACES.md`).
 * Merge-blocking `@release-gate`: `ci.yml` `ui-e2e-live`, `release-smoke.ps1 -LivePlaywright`.
 *
 * Buyer shell does not yet surface whitelabel fields in an export modal; seeded `analysisRequestJson` on export history
 * satisfies the evaluator pre-fill contract (asserted via API alongside UI Pack A/B copy).
 */
import { expect, test } from "@playwright/test";

import {
  DEMO_WORKSPACE_B_LIVE_IDS,
  DEMO_WORKSPACE_B_REGULATED_RUN_ID,
  injectDemoWorkspaceOperatorScope,
} from "./helpers/demo-workspace-live-scope";
import {
  getRunArchitectureExportHistoryRaw,
  liveApiBase,
  postConsultingAnalysisDocxRaw,
} from "./helpers/live-api-client";

const releaseGateTag = "@release-gate";

type RunExportHistoryJson = {
  exports?: ReadonlyArray<{
    exportRecordId?: string;
    analysisRequestJson?: string | null;
  }>;
};

test.describe(`demo-workspace-b-smoke (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    expect(health.ok(), await health.text()).toBeTruthy();
  });

  test("regulated storyline surfaces Pack A/B findings, severities, consulting DOCX, whitelabel export JSON", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);

    await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_B_LIVE_IDS);
    await page.goto(`/reviews/${DEMO_WORKSPACE_B_REGULATED_RUN_ID}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Run detail", level: 2 })).toBeVisible({ timeout: 90_000 });

    await expect(page.getByText(/Loading review detail/i)).toHaveCount(0, { timeout: 90_000 });

    await expect(page.getByText(/Review could not be loaded/i)).toHaveCount(0);

    /** Pack A narrative (Responsible AI governance engine + rule identifiers from seed fixtures). */
    await expect(page.locator("main").getByText(/Promoted scoring ensemble lacks immutable lineage hash/i)).toBeVisible({
      timeout: 90_000,
    });

    await expect(page.locator("main").getByText(/ai-gov-002/i).first()).toBeVisible({ timeout: 90_000 });

    /** Pack B security baseline posture (dual-homed listener rule from seed fixtures). */
    await expect(page.locator("main").getByText(/Inference gateway still advertises interim public listener/i)).toBeVisible({
      timeout: 90_000,
    });

    await expect(page.locator("main").getByText(/sec-base-104/i).first()).toBeVisible({ timeout: 90_000 });

    await page.locator("#run-explanation").scrollIntoViewIfNeeded();

    await expect(page.getByTestId("quick-decision-summary")).toBeVisible({ timeout: 60_000 });

    await expect(
      page
        .getByTestId("quick-decision-summary")
        .getByText(/^High$|^Critical$/, { exact: true })
        .first(),
    ).toBeVisible({ timeout: 30_000 });

    const docxExport = await postConsultingAnalysisDocxRaw(request, DEMO_WORKSPACE_B_REGULATED_RUN_ID, {
      tenantId: DEMO_WORKSPACE_B_LIVE_IDS.tenantId,
      workspaceId: DEMO_WORKSPACE_B_LIVE_IDS.workspaceId,
      projectId: DEMO_WORKSPACE_B_LIVE_IDS.projectId,
    });

    expect(
      docxExport.status(),
      `Consulting DOCX export expected 200 — body starts: ${(await docxExport.text()).slice(0, 200)}`,
    ).toBe(200);

    const contentTypeRaw = docxExport.headers()["content-type"] ?? "";

    const contentType = contentTypeRaw.toLowerCase();

    expect(contentType, contentTypeRaw).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    const bytes = Buffer.from(await docxExport.body());

    expect(bytes.byteLength).toBeGreaterThan(4096);

    const historyRaw = await getRunArchitectureExportHistoryRaw(
      request,
      DEMO_WORKSPACE_B_REGULATED_RUN_ID,
      {
        tenantId: DEMO_WORKSPACE_B_LIVE_IDS.tenantId,
        workspaceId: DEMO_WORKSPACE_B_LIVE_IDS.workspaceId,
        projectId: DEMO_WORKSPACE_B_LIVE_IDS.projectId,
      },
    );

    expect(historyRaw.ok(), await historyRaw.text()).toBeTruthy();

    const historyPayload = (await historyRaw.json()) as RunExportHistoryJson;

    const exportsList = historyPayload.exports ?? [];

    expect(exportsList.length).toBeGreaterThan(0);

    const blobs = exportsList.map((row) => (row.analysisRequestJson ?? "").trim()).filter((s) => s.length > 0);

    expect(blobs.length).toBeGreaterThan(0);

    const aggregated = blobs.join("\n");

    expect(aggregated).toContain("Meridian Advisory Group");

    expect(aggregated).toMatch(/reviewBoardWhitelabelFirmDisplayName/i);

    /** Placeholder dialog for future UI parity — today the API JSON is authoritative for consultant pre-fill. */
    test.info().annotations.push({
      type: "whitelabel-assertion-surface",
      description:
        "Whitelabel pre-fill asserted on GET /v1/architecture/run/{runId}/exports AnalysisRequestJson (camelCase reviewBoardWhitelabel* fields).",
    });

    /** Buyer deliverables still expose deterministic export affordances (ZIP + Markdown summary). */
    await page.locator("#artifacts-exports").scrollIntoViewIfNeeded();

    await expect(page.locator("#artifacts-exports").getByRole("link", { name: /Download evidence package/i })).toBeVisible();
    await expect(page.getByTestId("golden-manifest-markdown-download-button")).toBeVisible();
  });
});
