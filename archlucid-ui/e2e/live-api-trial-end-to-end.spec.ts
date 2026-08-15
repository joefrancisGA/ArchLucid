/**
 * Merge-blocking **V1 self-serve trial** acceptance: register → audits → scoped UI → trial metering → expiry →
 * billing checkout (Noop) → harness “Stripe-style” activation → converted tenant writes + metrics.
 *
 * Requires **DevelopmentBypass**, **Sql**, **Noop** billing, **Simulator** agents, **Prometheus** scrape enabled,
 * and **`LIVE_E2E_HARNESS_SECRET`** matching **`ArchLucid:E2eHarness:SharedSecret`** on the API (see `docs/runbooks/TRIAL_END_TO_END.md`).
 */
import { expect, test } from "@playwright/test";

import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

import { openDemoWorkspaceReviewDetailShellReady } from "./helpers/demo-workspace-live-scope";
import {
  createRun,
  executeRun,
  getTenantTrialStatus,
  isInviteOnlyRegistrationResponse,
  liveApiBase,
  resolveLiveAuthMode,
  liveE2eHarnessHeaders,
  liveJsonHeaders,
  liveTenantScopeHeaders,
  postArchitectureRequestRaw,
  postHarnessBillingSimulateActivated,
  postHarnessTrialSetExpires,
  searchAudit,
  waitForAuthorityBuyerSummaryGoldenManifest,
  waitForReadyForCommit,
} from "./helpers/live-api-client";
import { expectFinalizedManifestLinkVisible, expectLiveManifestDetailPageReady } from "./helpers/operator-journey";
import { ensureFullGuidedWizardMode } from "./helpers/reviews-new-baseline-wizard";
import { uniqueTrialWorkEmail } from "./helpers/trial-registration-email";
import { manifestIdFromSignedRecordHref, runIdFromReviewsHref } from "./helpers/run-id-from-href";

type Register201 = {
  tenantId: string;
  defaultWorkspaceId: string;
  defaultProjectId: string;
};

function readCounterValue(text: string, metricPrefix: string, labelNeedles: string[]): number {
  let sum = 0;

  for (const line of text.split("\n")) {
    if (!line.startsWith(metricPrefix)) {
      continue;
    }

    if (!labelNeedles.every((n) => line.includes(n))) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    const v = Number.parseFloat(parts[parts.length - 1] ?? "");

    if (Number.isFinite(v)) {
      sum += v;
    }
  }

  return sum;
}

function readOtelHistogramCount(text: string, baseMetric: string): number {
  const key = `${baseMetric}_count`;

  for (const line of text.split("\n")) {
    if (line.startsWith(key)) {
      const parts = line.trim().split(/\s+/);
      const v = Number.parseFloat(parts[parts.length - 1] ?? "0");

      return Number.isFinite(v) ? v : 0;
    }
  }

  return 0;
}

test.describe("live-api-trial-end-to-end", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(`Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}).`);
    }
  });

  test("self-serve trial: register → UI → limits → expiry → checkout → activate → metrics", async ({
    page,
    request,
  }) => {
    test.setTimeout(600_000);
    test.skip(resolveLiveAuthMode() !== "bypass", "Requires DevelopmentBypass (default ui-e2e-live API).");

    let harnessOk = false;

    try {
      liveE2eHarnessHeaders();
      harnessOk = true;
    } catch {
      harnessOk = false;
    }

    test.skip(!harnessOk, "Set LIVE_E2E_HARNESS_SECRET (>= 16 chars) on the API and Playwright (see TRIAL_END_TO_END.md).");

    const metricsProbe = await request.get(`${liveApiBase}/metrics`, { timeout: 15_000 });

    test.skip(!metricsProbe.ok(), `GET /metrics returned ${metricsProbe.status()} — enable Observability:Prometheus:Enabled for this gate.`);

    const metricsBefore = await metricsProbe.text();
    const signupsBefore = readCounterValue(metricsBefore, "archlucid_trial_signups_total", ['source="self_service"']);
    const conversionsBefore = readCounterValue(metricsBefore, "archlucid_trial_conversion_total", [
      'from_state="Active"',
      'to_tier="Team"',
    ]);
    const checkoutCompletedBefore = readCounterValue(metricsBefore, "archlucid_billing_checkouts_total", [
      'outcome="completed"',
      'provider="Noop"',
    ]);
    const firstRunCountBefore = readOtelHistogramCount(metricsBefore, "archlucid_trial_first_run_seconds");

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const adminEmail = uniqueTrialWorkEmail("e2e-b8", suffix);
    const orgName = `E2E B8 Trial Org ${suffix}`;

    const reg = await request.post(`${liveApiBase}/v1/register`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {
        organizationName: orgName,
        adminEmail,
        adminDisplayName: "E2E B8 Admin",
        baselineReviewCycleHours: 18.5,
        baselineReviewCycleSource: "e2e live self-serve trial estimate",
      },
    });

    const regBodyText = await reg.text();

    if (isInviteOnlyRegistrationResponse(reg.status(), regBodyText)) {
      throw new Error(
        "POST /v1/register returned InviteOnly 404. Set Auth__PublicSignup__Mode=PublicSelfService on the API " +
          "and NEXT_PUBLIC_PUBLIC_SIGNUP_MODE=public-self-service on the Next build for trial live E2E " +
          "(see docs/runbooks/TRIAL_END_TO_END.md).",
      );
    }

    expect(reg.status(), regBodyText).toBe(201);

    const provisioned = JSON.parse(regBodyText) as Register201;

    expect(provisioned.tenantId.length).toBeGreaterThan(0);
    expect(provisioned.defaultWorkspaceId.length).toBeGreaterThan(0);
    expect(provisioned.defaultProjectId.length).toBeGreaterThan(0);

    const scope = {
      tenantId: provisioned.tenantId,
      workspaceId: provisioned.defaultWorkspaceId,
      projectId: provisioned.defaultProjectId,
    };

    const auditDeadline = Date.now() + 120_000;
    let sawSelfReg = false;
    let sawProvisioned = false;

    while (Date.now() < auditDeadline) {
      const selfRows = await searchAudit(request, {
        eventType: "TenantSelfRegistered",
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        take: "50",
      });

      const trialRows = await searchAudit(request, {
        eventType: "TrialProvisioned",
        tenantId: scope.tenantId,
        workspaceId: scope.workspaceId,
        projectId: scope.projectId,
        take: "50",
      });

      sawSelfReg = selfRows.some((r) => r.eventType === "TenantSelfRegistered");
      sawProvisioned = trialRows.some((r) => r.eventType === "TrialProvisioned");

      if (sawSelfReg && sawProvisioned) {
        break;
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(sawSelfReg, "TenantSelfRegistered audit expected after POST /v1/register.").toBe(true);
    expect(sawProvisioned, "TrialProvisioned audit expected after trial bootstrap (email trigger path).").toBe(true);

    const trialJson = await getTenantTrialStatus(request, scope);

    for (let seatPoll = 0; seatPoll < 12 && (trialJson.trialSeatsUsed ?? 0) < 1; seatPoll += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      Object.assign(trialJson, await getTenantTrialStatus(request, scope));
    }

    expect(trialJson.status).toBe("Active");
    expect(trialJson.daysRemaining).toBeGreaterThanOrEqual(13);
    expect(trialJson.daysRemaining).toBeLessThanOrEqual(14);
    expect(trialJson.trialRunsUsed).toBe(0);
    expect(trialJson.trialRunsLimit).toBe(10);
    expect(trialJson.trialSeatsUsed).toBe(1);
    expect(trialJson.trialSeatsLimit).toBe(3);
    expect(trialJson.trialSampleRunId).toBeTruthy();
    expect(trialJson.baselineReviewCycleHours).toBe(18.5);
    expect(trialJson.baselineReviewCycleSource).toBe("e2e live self-serve trial estimate");
    expect(trialJson.baselineReviewCycleCapturedUtc).toBeTruthy();

    const commercialPackagingProbe = await request.get(`${liveApiBase}/v1/policy-packs`, {
      headers: { Accept: "application/json", ...liveTenantScopeHeaders(scope) },
    });
    const packagingStatus = commercialPackagingProbe.status();
    const packagingProblem = (await commercialPackagingProbe.json()) as {
      type?: string;
      status?: number;
    };

    expect(packagingStatus).toBeGreaterThanOrEqual(403);
    expect(packagingStatus).toBeLessThan(500);
    expect((commercialPackagingProbe.headers()["content-type"] ?? "").toLowerCase()).toContain("application/problem");
    expect(packagingProblem.type ?? "", "trial tenants must not receive a successful policy-pack catalog").toMatch(
      /resource-not-found|packaging-tier-insufficient/i,
    );

    await page.addInitScript(
      (payload) => {
        window.sessionStorage.setItem("archlucid_last_registration", JSON.stringify(payload));
      },
      {
        tenantId: scope.tenantId,
        defaultWorkspaceId: scope.workspaceId,
        defaultProjectId: scope.projectId,
        adminEmail,
        organizationName: orgName,
      },
    );

    await page.goto("/architecture/first-review-guide?source=registration");
    await expect(page.getByTestId("onboarding-open-sample-run")).toBeVisible({ timeout: 120_000 });

    const sampleHref = (await page.getByTestId("onboarding-open-sample-run").getAttribute("href")) ?? "";

    // Canonical route is `/architecture/reviews/*` (legacy `/runs/*` bookmarks 404; use canonical paths in tests).
    expect(sampleHref).toMatch(/^\/architecture\/reviews\//);

    const sampleRunIdFromHref = runIdFromReviewsHref(sampleHref);

    await waitForAuthorityBuyerSummaryGoldenManifest(request, sampleRunIdFromHref, 90_000, scope);
    await openDemoWorkspaceReviewDetailShellReady(page, scope, sampleRunIdFromHref, { timeoutMs: 45_000 });

    const manifestLink = await expectFinalizedManifestLinkVisible(page, {
      runId: sampleRunIdFromHref,
      timeoutMs: 120_000,
    });

    const manifestHref = (await manifestLink.getAttribute("href")) ?? "";
    const manifestId = manifestIdFromSignedRecordHref(manifestHref);

    expect(manifestId.length).toBeGreaterThan(0);

    await Promise.all([
      page.waitForURL(/\/(?:signed-records|manifests)\/.+/i, { waitUntil: "commit" }),
      manifestLink.click(),
    ]);

    await expectLiveManifestDetailPageReady(page, manifestId, { timeoutMs: 120_000 });

    const sampleRunId = trialJson.trialSampleRunId!.includes("-")
      ? trialJson.trialSampleRunId!
      : `${trialJson.trialSampleRunId!.slice(0, 8)}-${trialJson.trialSampleRunId!.slice(8, 12)}-${trialJson.trialSampleRunId!.slice(12, 16)}-${trialJson.trialSampleRunId!.slice(16, 20)}-${trialJson.trialSampleRunId!.slice(20, 32)}`;

    // Templates wizard (NewRunWizardClient) only mounts on the detailed path — default tab is Quick start.
    await page.goto(
      `/architecture/reviews/new?path=detailed&sampleRunId=${encodeURIComponent(sampleRunId)}`,
      { waitUntil: "domcontentloaded" },
    );

    await expect(page.getByRole("heading", { name: START_REVIEW_LABEL, level: 1 })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("reviews-new-path-detailed")).toHaveAttribute("aria-selected", "true", {
      timeout: 30_000,
    });

    // NewRunWizardClient is dynamic-imported on the detailed tab — wait before interacting.
    await expect(page.locator("[data-wizard-ready='true']")).toBeAttached({ timeout: 120_000 });
    // Default wizard mode is quick start; full preset step (wizard-start-blank) requires explicit full mode.
    await ensureFullGuidedWizardMode(page);
    // Renamed from "Use defaults" — advances off the starting-point step via onStartingPointCommitted.
    await page.getByTestId("wizard-start-blank").click();

    // Step 0 uses "Continue"; later steps use "Next".
    for (let step = 0; step < 5; step += 1) {
      const forward = page.getByRole("button", { name: /^(Continue|Next)$/ });
      await expect(forward).toBeEnabled({ timeout: 60_000 });
      await forward.click();
    }

    const createRespPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/proxy/v1/architecture/request") && r.request().method() === "POST",
      { timeout: 120_000 },
    );

    const startReview = page.getByRole("button", {
      name: /Start Architecture Review|Start an architecture review/i,
    });
    await expect(startReview).toBeEnabled({ timeout: 60_000 });
    await startReview.click();

    const createResp = await createRespPromise;
    const createJson = (await createResp.json()) as { run?: { runId?: string } };
    const wizardRunId = createJson.run?.runId ?? "";

    expect(wizardRunId.length).toBeGreaterThan(0);
    expect(createResp.status()).toBe(201);

    await expect(page.getByText(/Architecture review .* created/i)).toBeVisible({ timeout: 120_000 });

    await executeRun(request, wizardRunId, scope);
    await waitForReadyForCommit(request, wizardRunId, 120_000, scope);
    await waitForAuthorityBuyerSummaryGoldenManifest(request, wizardRunId, 90_000, scope);
    await openDemoWorkspaceReviewDetailShellReady(page, scope, wizardRunId, { timeoutMs: 45_000 });

    await page.getByRole("button", { name: "Finalize manifest" }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Finalize manifest" }).click();

    await expect(page.getByText(/This review is already finalized/i)).toBeVisible({ timeout: 120_000 });

    await expect(page.getByTestId("email-run-to-sponsor-first-commit-badge")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText(/Day \d+ since first finalization/i)).toBeVisible({ timeout: 10_000 });

    const afterFirstCommit = await getTenantTrialStatus(request, scope);

    expect(afterFirstCommit.trialRunsUsed).toBe(1);
    expect(afterFirstCommit.firstCommitUtc, "first commit should anchor sponsor day badge (trial-status)").toBeTruthy();

    const burnBody = {
      requestId: `B8-BURN-${suffix}`,
      description:
        "Burn trial run allowance for E2E. Design a minimal secure API with private endpoints and managed identity.",
      systemName: "BurnRun",
      environment: "prod",
      cloudProvider: 1,
      constraints: ["Private networking"],
      requiredCapabilities: ["Managed Identity"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    for (let i = 0; i < 9; i += 1) {
      await createRun(
        request,
        {
          ...burnBody,
          requestId: `B8-BURN-${suffix}-${i}`,
        },
        scope,
      );
    }

    const atLimit = await getTenantTrialStatus(request, scope);

    expect(atLimit.trialRunsUsed).toBe(10);

    const blocked = await postArchitectureRequestRaw(
      request,
      {
        ...burnBody,
        requestId: `B8-BLOCK-RUNS-${suffix}`,
      },
      scope,
    );

    expect(blocked.status(), await blocked.text()).toBe(402);
    expect(blocked.headers()["content-type"] ?? "").toContain("application/problem+json");

    const problemRuns = (await blocked.json()) as { type?: string; extensions?: { trialReason?: string } };

    expect(problemRuns.type).toBe("https://archlucid.dev/problem/trial-expired");

    const warpRes = await postHarnessTrialSetExpires(
      request,
      scope.tenantId,
      new Date(Date.now() - 5000).toISOString(),
    );

    expect(warpRes.status(), await warpRes.text()).toBe(204);

    const expiredRead = await getTenantTrialStatus(request, scope);

    expect(expiredRead.status).toBe("Active");
    expect(expiredRead.daysRemaining).toBe(0);

    const blockedExpired = await postArchitectureRequestRaw(
      request,
      {
        ...burnBody,
        requestId: `B8-BLOCK-EXP-${suffix}`,
      },
      scope,
    );

    expect(blockedExpired.status()).toBe(402);

    const checkout = await request.post(`${liveApiBase}/v1/tenant/billing/checkout`, {
      headers: { ...liveJsonHeaders(), ...liveTenantScopeHeaders(scope) },
      data: {
        targetTier: "Team",
        returnUrl: "https://example.com/billing/return",
        cancelUrl: "https://example.com/billing/cancel",
      },
    });

    expect(checkout.status(), await checkout.text()).toBe(200);

    const checkoutJson = (await checkout.json()) as { checkoutUrl?: string; providerSessionId?: string };

    expect(checkoutJson.checkoutUrl ?? "").toContain("https://billing.archlucid.local/noop-checkout");
    expect(checkoutJson.providerSessionId ?? "").toMatch(/^noop_sess_/);

    const sim = await postHarnessBillingSimulateActivated(request, {
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      providerSubscriptionId: checkoutJson.providerSessionId,
      checkoutTier: "Team",
      provider: "Noop",
    });

    expect(sim.status(), await sim.text()).toBe(204);

    const convRows = await searchAudit(request, {
      eventType: "TenantTrialConverted",
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      take: "50",
    });

    expect(convRows.some((r) => r.eventType === "TenantTrialConverted")).toBe(true);

    const unblock = await postArchitectureRequestRaw(
      request,
      {
        ...burnBody,
        requestId: `B8-POST-CONVERT-${suffix}`,
      },
      scope,
    );

    expect([200, 201].includes(unblock.status()), await unblock.text()).toBe(true);

    await page.goto("/runs");

    await expect(page.getByRole("region", { name: "Trial subscription" })).toHaveCount(0, { timeout: 60_000 });

    const metricsAfterRes = await request.get(`${liveApiBase}/metrics`, { timeout: 30_000 });

    expect(metricsAfterRes.ok()).toBeTruthy();

    const metricsAfter = await metricsAfterRes.text();
    const signupsAfter = readCounterValue(metricsAfter, "archlucid_trial_signups_total", ['source="self_service"']);
    const conversionsAfter = readCounterValue(metricsAfter, "archlucid_trial_conversion_total", [
      'from_state="Active"',
      'to_tier="Team"',
    ]);
    const checkoutCompletedAfter = readCounterValue(metricsAfter, "archlucid_billing_checkouts_total", [
      'outcome="completed"',
      'provider="Noop"',
    ]);
    const firstRunCountAfter = readOtelHistogramCount(metricsAfter, "archlucid_trial_first_run_seconds");

    expect(signupsAfter - signupsBefore).toBeGreaterThanOrEqual(1);
    expect(conversionsAfter - conversionsBefore).toBeGreaterThanOrEqual(1);
    expect(checkoutCompletedAfter - checkoutCompletedBefore).toBeGreaterThanOrEqual(1);
    expect(firstRunCountAfter - firstRunCountBefore).toBeGreaterThanOrEqual(1);
  });
});
