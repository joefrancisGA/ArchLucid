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
  openDemoWorkspaceReviewDetailShellReady,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import { demoWorkspacesFixtureManifest } from "./helpers/demo-workspaces-fixture-manifest";
import {
  countFindingsInAuthorityRunDetailPayload,
  getAuthorityBuyerSummaryRaw,
  getAuthorityRunDetailRaw,
  getRunArchitectureExportHistoryRaw,
  liveApiBase,
  postConsultingAnalysisDocxRaw,
  waitForAuthorityBuyerSummaryGoldenManifest,
} from "./helpers/live-api-client";
import {
  ensureBuyerDeliverablesSectionExpanded,
  expectBuyerPolishedReviewDetailWorkspaceCore,
  expectQuickDecisionSeverityVisible,
  openReviewDetailWorkspaceTab,
} from "./helpers/operator-journey";

const releaseGateTag = "@release-gate";

type RunExportHistoryJson = {
  exports?: ReadonlyArray<{
    exportRecordId?: string;
    analysisRequestJson?: string | null;
  }>;
};

function readWhitelabelFirmDisplayNameFromParsedObject(
  parsed: Record<string, unknown> | null,
): string | null {
  if (parsed === null) {
    return null;
  }

  const camel = parsed.reviewBoardWhitelabelFirmDisplayName;
  const pascal = parsed.ReviewBoardWhitelabelFirmDisplayName;
  const candidate =
    (typeof camel === "string" ? camel : typeof pascal === "string" ? pascal : "").trim();

  return candidate.length > 0 ? candidate : null;
}

function extractWhitelabelFirmDisplayNameFromExportBlobs(blobs: readonly string[]): string | null {
  for (const blob of blobs) {
    // 1) normal JSON object
    try {
      const parsed = JSON.parse(blob) as Record<string, unknown> | string;

      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const candidate = readWhitelabelFirmDisplayNameFromParsedObject(parsed);

        if (candidate !== null) {
          return candidate;
        }
      }

      // 2) double-encoded JSON string payload
      if (typeof parsed === "string") {
        try {
          const reparsed = JSON.parse(parsed) as Record<string, unknown>;
          const candidate = readWhitelabelFirmDisplayNameFromParsedObject(reparsed);

          if (candidate !== null) {
            return candidate;
          }
        } catch {
          // fall through to regex
        }
      }
    } catch {
      // fall through to regex
    }

    // 3) raw JSON text
    const rawMatch = /"(?:reviewBoardWhitelabelFirmDisplayName|ReviewBoardWhitelabelFirmDisplayName)"\s*:\s*"([^"]+)"/i.exec(blob);

    if (rawMatch?.[1]?.trim()) {
      return rawMatch[1].trim();
    }

    // 4) escaped JSON text (e.g. \"reviewBoardWhitelabelFirmDisplayName\":\"Acme\")
    const escapedMatch =
      /\\"(?:reviewBoardWhitelabelFirmDisplayName|ReviewBoardWhitelabelFirmDisplayName)\\"\s*:\s*\\"([^\\"]+)\\"/i.exec(blob);

    if (escapedMatch?.[1]?.trim()) {
      return escapedMatch[1].trim();
    }
  }

  return null;
}

test.describe(
  `demo-workspace-b-smoke (${releaseGateTag})`,
  { tag: [releaseGateTag, "@founder", "@critical"] },
  () => {

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    expect(health.ok(), await health.text()).toBeTruthy();

    await ensureDemoWorkspaceSeedReady(request, { workspaces: ["B"] });
  });

  test("regulated storyline surfaces Pack A/B findings, severities, consulting DOCX, whitelabel export JSON", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);

    const authorityProbe = await getAuthorityRunDetailRaw(request, DEMO_WORKSPACE_B_REGULATED_RUN_ID, DEMO_WORKSPACE_B_LIVE_IDS);

    expect(
      authorityProbe.ok(),
      `GET /v1/authority/reviews/{runId} expected 200 — ${await authorityProbe.text()}`,
    ).toBeTruthy();

    const authorityJson = await authorityProbe.json();

    expect(countFindingsInAuthorityRunDetailPayload(authorityJson)).toBe(
      demoWorkspacesFixtureManifest.workspaceB.expectedCommittedFindingCount,
    );

    // Buyer shell SSR uses `/buyer-summary` — wait for that surface before navigating.
    await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      DEMO_WORKSPACE_B_REGULATED_RUN_ID,
      90_000,
      DEMO_WORKSPACE_B_LIVE_IDS,
    );

    const buyerSummaryProbe = await getAuthorityBuyerSummaryRaw(
      request,
      DEMO_WORKSPACE_B_REGULATED_RUN_ID,
      DEMO_WORKSPACE_B_LIVE_IDS,
    );

    expect(
      buyerSummaryProbe.ok(),
      `GET /v1/authority/reviews/{runId}/buyer-summary expected 200 — ${await buyerSummaryProbe.text()}`,
    ).toBeTruthy();

    await openDemoWorkspaceReviewDetailShellReady(
      page,
      DEMO_WORKSPACE_B_LIVE_IDS,
      DEMO_WORKSPACE_B_REGULATED_RUN_ID,
    );
    await expectBuyerPolishedReviewDetailWorkspaceCore(page);

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_B_REGULATED_RUN_ID, "overview");

    await expect(page.getByTestId("review-detail-workspace-panel-overview")).toBeVisible({ timeout: 60_000 });

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_B_REGULATED_RUN_ID, "findings");

    const quickSummary = page.getByTestId("quick-decision-summary");

    await expect(quickSummary).toBeVisible({ timeout: 60_000 });

    /** Pack A narrative (Responsible AI governance engine from seed fixtures). */
    await expect(
      quickSummary.getByText(/Promoted scoring ensemble lacks immutable lineage hash/i).first(),
    ).toBeVisible({ timeout: 90_000 });

    /** Pack B security baseline posture (public exposure from seed fixtures). */
    await expect(
      quickSummary.getByText(/Inference gateway still advertises interim public listener/i).first(),
    ).toBeVisible({ timeout: 90_000 });

    await expectQuickDecisionSeverityVisible(quickSummary, { timeoutMs: 30_000 });

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

    expect(aggregated).toMatch(/reviewBoardWhitelabelFirmDisplayName/i);

    const whitelabelFirmDisplayName = extractWhitelabelFirmDisplayNameFromExportBlobs(blobs);

    expect(
      whitelabelFirmDisplayName,
      "expected export AnalysisRequestJson to include reviewBoardWhitelabelFirmDisplayName",
    ).not.toBeNull();

    const expectedFirmDisplayName = process.env.REVIEW_BOARD_WHITELABEL_FIRM_DISPLAY_NAME?.trim();

    if (expectedFirmDisplayName !== undefined && expectedFirmDisplayName.length > 0) {
      expect(whitelabelFirmDisplayName).toBe(expectedFirmDisplayName);
    } else {
      expect(whitelabelFirmDisplayName!.length).toBeGreaterThan(0);
    }

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

    // DOCX is a ZIP container; seeded Meridian consulting export is ~3.9KB — 4096 was flaky in CI.
    expect(bytes.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(bytes.byteLength).toBeGreaterThan(2048);

    /** Placeholder dialog for future UI parity — today the API JSON is authoritative for consultant pre-fill. */
    test.info().annotations.push({
      type: "whitelabel-assertion-surface",
      description:
        "Whitelabel pre-fill asserted on GET /v1/architecture/review/{runId}/exports AnalysisRequestJson (camelCase reviewBoardWhitelabel* fields).",
    });

    /** Buyer deliverables still expose deterministic export affordances (ZIP + Markdown summary). */
    await ensureBuyerDeliverablesSectionExpanded(page, DEMO_WORKSPACE_B_REGULATED_RUN_ID);

    await expect(page.locator("#artifacts-exports").getByRole("link", { name: /Download evidence bundle/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator("#artifacts-exports").getByTestId("golden-manifest-markdown-download-button")).toBeVisible();
  });
});
