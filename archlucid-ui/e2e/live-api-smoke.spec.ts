/**
 * Narrow live staging smoke: seeded demo tenant scope, baseline-first wizard upload of a minimal ArchLucid packager ZIP,
 * real browser traffic through `/api/proxy/**` (no `page.route` stubs), backend execute, then canonical review findings UI.
 *
 * Additional operator slices (still real API via {@link helpers/live-api-client}): policy pack assignment (effective packs + `/policy-packs`),
 * and authority compare + `/insights/compare-two-reviews` hydrate against seeded workspace A baseline.
 *
 * **Auth / env**
 * - **DevelopmentBypass:** default CI — no browser login form; scope comes from {@link injectDemoWorkspaceOperatorScope}.
 * - **JWT:** set **`LIVE_JWT_TOKEN`** (API) and **`ARCHLUCID_PROXY_BEARER_TOKEN`** (same token for Next standalone proxy).
 * - **ApiKey:** configure **`ARCHLUCID_API_KEY`** for the Next process (Playwright merges `process.env` into `webServer`).
 *
 * **`LIVE_API_URL`** selects the upstream API (`playwright.config.ts` → **`e2e/start-e2e-live-api.ts`**).
 */
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { strToU8, zipSync } from "fflate";

import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  injectDemoWorkspaceOperatorScope,
  openDemoWorkspaceReviewDetailShellReady,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import {
  assignPolicyPack,
  commitRun,
  compareAuthorityRuns,
  countFindingsInAuthorityRunDetailPayload,
  createPolicyPack,
  createRun,
  executeRun,
  getAuthorityRunDetailRaw,
  getEffectivePolicyPacks,
  liveApiBase,
  liveE2eArchitectureDescription,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  minimalPolicyPackContentJson,
  resolveLiveJwtMode,
  waitForAuthorityBuyerSummaryGoldenManifest,
  waitForReadyForCommit,
} from "./helpers/live-api-client";
import {
  comparisonRequestOutcomePanel,
  comparePageMainHeading,
  openReviewDetailWorkspaceTab,
} from "./helpers/operator-journey";
import { expandWizardBaselineZipEvidence } from "./helpers/wizard-baseline-zip-evidence";

function makeLiveSmokeArchLucidZipForInput(): { name: string; mimeType: string; buffer: Buffer } {
  const manifest = {
    schemaVersion: 1,
    scriptVersion: "0.2.0",
    collectionTimestamp: new Date().toISOString(),
    subscriptionId: "11111111-1111-1111-1111-111111111111",
    scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/E2eLiveSmokeRg",
  };
  const zipped = zipSync({
    "manifest.json": strToU8(JSON.stringify(manifest)),
    "resources.json": strToU8("[]"),
  });

  return {
    name: "e2e-live-smoke-azure-pack.zip",
    mimeType: "application/zip",
    buffer: Buffer.from(zipped),
  };
}

function buildLiveSmokeScopedRunCreateBody(suffix: string): Record<string, unknown> {
  return {
    requestId: `E2E-LIVE-SMOKE-SCOPE-${suffix}-${Date.now()}`,
    description: liveE2eArchitectureDescription(
      "Live smoke scoped run for authority compare alongside seeded demo workspace A product tour baseline.",
    ),
    systemName: `LiveSmokeCmp${suffix}`,
    environment: "prod",
    cloudProvider: 1,
    constraints: [] as string[],
    requiredCapabilities: ["SQL"],
    assumptions: [] as string[],
    priorManifestVersion: null as string | null,
  };
}

async function throwIfAuthorityCompareRunsNotOk(res: APIResponse, label: string): Promise<void> {
  if (res.ok()) {
    return;
  }

  const text = await res.text();

  throw new Error(`${label} failed ${res.status()}: ${text.slice(0, 500)}`);
}

async function waitForSealedFindings(
  request: APIRequestContext,
  runId: string,
  scope: typeof DEMO_WORKSPACE_A_LIVE_IDS,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await getAuthorityRunDetailRaw(request, runId, scope);

    if (res.ok()) {
      const body: unknown = await res.json();

      if (countFindingsInAuthorityRunDetailPayload(body) > 0) {
        return;
      }
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for sealed findings on run ${runId}`);
}

test.describe("live-api-smoke", { tag: ["@founder", "@critical", "@release-smoke"] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Set LIVE_API_URL for staging or start ArchLucid.Api.`,
      );
    }

    await ensureDemoWorkspaceSeedReady(request, { workspaces: ["A"] });
  });

  test("pilot spine: scoped shell, baseline ZIP wizard, execute, view findings (real proxy, no mocks)", async ({
    page,
    request,
  }) => {
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    if (resolveLiveJwtMode()) {
      const bearer = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";

      test.skip(
        bearer.length === 0,
        "JWT mode requires ARCHLUCID_PROXY_BEARER_TOKEN on the UI process so /api/proxy forwards Authorization (typically the same value as LIVE_JWT_TOKEN).",
      );
    }

    const scope = DEMO_WORKSPACE_A_LIVE_IDS;

    await injectDemoWorkspaceOperatorScope(page, scope);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible({ timeout: 60_000 });

    await page.goto("/architecture/reviews/new?baseline=1", { waitUntil: "domcontentloaded" });

    // `?baseline=1` opens the 4-step SimplifiedPilotWizard: identity/description (step 1), optional
    // Azure ZIP evidence inside a collapsed advanced section (step 2), baseline metrics, then review.
    await expect(page.getByTestId("simplified-pilot-wizard")).toBeVisible({ timeout: 60_000 });

    await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 1 of 4/i, {
      timeout: 30_000,
    });

    const forward = page.getByRole("button", { name: /^(Continue|Next)$/ });

    await expect(page.getByRole("textbox", { name: "System Name" })).toBeVisible({ timeout: 30_000 });

    const description = page.getByRole("textbox", { name: "Description" });
    const descriptionText = (await description.inputValue()).trim();

    if (descriptionText.length < 10) {
      await description.fill(
        liveE2eArchitectureDescription(
          "Live smoke pilot spine: assess security, cost, and governance before production rollout.",
        ),
      );
    }

    await forward.click();

    await expect(page.getByTestId("simplified-pilot-progress")).toContainText(/step 2 of 4/i, {
      timeout: 30_000,
    });

    await expandWizardBaselineZipEvidence(page);

    const zipFile = makeLiveSmokeArchLucidZipForInput();

    await page.getByTestId("wizard-baseline-zip-field-input").setInputFiles(zipFile);

    await expect(page.getByTestId("wizard-azure-zip-error")).toHaveCount(0, { timeout: 30_000 });

    await forward.click();

    await expect(page.getByTestId("wizard-baseline-metrics-step")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("wizard-baseline-review-cycle-hours").fill("40");

    await forward.click();

    await expect(page.getByRole("button", { name: "Start an architecture review" })).toBeVisible({ timeout: 60_000 });

    const createRespPromise = page.waitForResponse(
      (r) => r.url().includes("/api/proxy/v1/architecture/request") && r.request().method() === "POST",
      { timeout: 120_000 },
    );

    await page.getByRole("button", { name: "Start an architecture review" }).click();

    const createResp = await createRespPromise;

    expect(createResp.ok(), await createResp.text()).toBeTruthy();

    const createJson = (await createResp.json()) as { run?: { runId?: string } };
    const runId = createJson.run?.runId ?? "";

    expect(runId.length).toBeGreaterThan(0);

    await executeRun(request, runId, scope);

    await waitForSealedFindings(request, runId, scope, 180_000);

    // `#run-explanation` / `#artifacts-exports` only render once the run has a golden manifest
    // (`buildRunDetailNavSections` gates both on `manifestId`), which is produced by an explicit
    // commit; sealed findings alone are not sufficient. Commit before asserting on those sections.
    await waitForReadyForCommit(request, runId, 120_000, scope);
    await commitRun(request, runId, scope);
    await waitForAuthorityBuyerSummaryGoldenManifest(request, runId, 90_000, scope);
    await openDemoWorkspaceReviewDetailShellReady(page, scope, runId, { timeoutMs: 45_000 });

    await openReviewDetailWorkspaceTab(page, runId, "findings");

    const runExplanation = page.locator("#run-explanation");

    await expect(runExplanation).toBeVisible({ timeout: 90_000 });
    await runExplanation.scrollIntoViewIfNeeded();

    await expect(page.getByTestId("quick-decision-summary")).toBeVisible({ timeout: 90_000 });
  });

  test("operator flow: policy pack assignment (API effective set + operator policy packs page)", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    if (resolveLiveJwtMode()) {
      const bearer = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";

      test.skip(
        bearer.length === 0,
        "JWT mode requires ARCHLUCID_PROXY_BEARER_TOKEN on the UI process so /api/proxy forwards Authorization (typically the same value as LIVE_JWT_TOKEN).",
      );
    }

    const scope = DEMO_WORKSPACE_A_LIVE_IDS;
    const complianceKey = `e2e-live-smoke-${Date.now()}`;
    const contentJson = minimalPolicyPackContentJson(complianceKey);
    const packName = `E2E Live Smoke Pack ${Date.now()}`;

    const { policyPackId } = await createPolicyPack(request, {
      name: packName,
      description: "live-api-smoke policy pack assignment coverage",
      packType: "ProjectCustom",
      initialContentJson: contentJson,
    });

    await assignPolicyPack(request, policyPackId, { version: "1.0.0" });

    const effective = await getEffectivePolicyPacks(request);
    const match = effective.packs?.find((p) => p.policyPackId === policyPackId);

    expect(match, "assigned policy pack should appear in GET /v1/policy-packs/effective").toBeTruthy();
    expect(match?.version).toBe("1.0.0");

    await injectDemoWorkspaceOperatorScope(page, scope);

    await page.goto("/governance/policy-packs", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /policy packs/i }).first()).toBeVisible({ timeout: 60_000 });

    await expect.soft(page.getByText(packName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });

  test("operator flow: authority comparison + compare page hydrate (scoped run vs seeded demo workspace A baseline)", async ({
    page,
    request,
  }) => {
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    if (resolveLiveJwtMode()) {
      const bearer = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";

      test.skip(
        bearer.length === 0,
        "JWT mode requires ARCHLUCID_PROXY_BEARER_TOKEN on the UI process so /api/proxy forwards Authorization (typically the same value as LIVE_JWT_TOKEN).",
      );
    }

    const scope = DEMO_WORKSPACE_A_LIVE_IDS;

    const { runId } = await createRun(request, buildLiveSmokeScopedRunCreateBody("A"), scope);

    await executeRun(request, runId, scope);
    await waitForSealedFindings(request, runId, scope, 180_000);

    const seededBaselineRunId = DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID;
    const compareRes = await compareAuthorityRuns(request, runId, seededBaselineRunId, scope);

    if (compareRes.status() === 404) {
      test.skip(
        true,
        "Seed demo workspace product tour baseline run absent in this API slice — rerun with demo fixtures seeded.",
      );
      return;
    }

    await throwIfAuthorityCompareRunsNotOk(compareRes, "GET /v1/authority/compare/runs");

    const compared = (await compareRes.json()) as {
      leftRunId?: string;
      rightRunId?: string;
      runLevelDiffCount?: number;
    };

    expect(compared.leftRunId).toBeTruthy();
    expect(compared.rightRunId).toBeTruthy();
    expect(typeof compared.runLevelDiffCount).toBe("number");

    await injectDemoWorkspaceOperatorScope(page, scope);

    await page.goto(
      `/insights/compare-two-reviews?leftRunId=${encodeURIComponent(runId)}&rightRunId=${encodeURIComponent(seededBaselineRunId)}`,
      {
        waitUntil: "domcontentloaded",
      },
    );

    await expect(comparePageMainHeading(page).first()).toBeVisible({ timeout: 60_000 });

    await expect(page.locator("#compare-structured")).toBeVisible({ timeout: 120_000 });

    await expect(comparisonRequestOutcomePanel(page)).toBeVisible({ timeout: 60_000 });
  });
});
