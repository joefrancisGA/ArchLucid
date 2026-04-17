/**
 * Live **self-service registration** (`POST /v1/register`) with optional **trial auth matrix** tags.
 *
 * Matrix tags (comma-separated `LIVE_TRIAL_E2E_MODES`, default `register-baseline`):
 * - `register-baseline` — anonymous org registration returns **201** (no local identity preconditions).
 * - `local-identity` — requires API with `Auth:Trial:Modes` including **LocalIdentity** and env
 *   `LIVE_TRIAL_LOCAL_PASSWORD`; performs `/v1/auth/trial/local/register` then `/v1/register` with matching email.
 *
 * **MsaExternalId** live checks are intentionally not automated here (long-lived CIAM secrets); use manual smoke
 * against a configured External ID tenant when that mode is enabled.
 */
import { expect, test } from "@playwright/test";

import { liveApiBase, liveAuthMode, searchAudit } from "./helpers/live-api-client";

const modes = (process.env.LIVE_TRIAL_E2E_MODES ?? "register-baseline")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function modeEnabled(tag: string): boolean {
  return modes.includes(tag);
}

test.describe("live-api-trial-signup", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(`Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}).`);
    }
  });

  test("register-baseline: POST /v1/register provisions org (201)", async ({ request }) => {
    test.skip(!modeEnabled("register-baseline"), 'Set LIVE_TRIAL_E2E_MODES to include "register-baseline".');

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const res = await request.post(`${liveApiBase}/v1/register`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {
        organizationName: `Live Trial Org ${suffix}`,
        adminEmail: `trial-admin-${suffix}@example.com`,
        adminDisplayName: "Live Trial Admin",
      },
    });

    expect(res.status(), await res.text()).toBe(201);
    const body = (await res.json()) as { tenantId?: string };

    expect(body.tenantId).toBeTruthy();
  });

  test('local-identity: register flow when API exposes trial local routes', async ({ request }) => {
    test.skip(!modeEnabled("local-identity"), 'Set LIVE_TRIAL_E2E_MODES to include "local-identity".');

    const password = process.env.LIVE_TRIAL_LOCAL_PASSWORD?.trim() ?? "";
    test.skip(password.length < 8, "Set LIVE_TRIAL_LOCAL_PASSWORD (>= 8 chars) for local-identity matrix row.");

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `trial-local-${suffix}@example.com`;

    const localReg = await request.post(`${liveApiBase}/v1/auth/trial/local/register`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: { email, password },
    });

    if (localReg.status() === 404) {
      test.skip(true, "Local trial identity is disabled on this API (Auth:Trial:Modes).");
    }

    expect(localReg.status(), await localReg.text()).toBe(201);

    const orgRes = await request.post(`${liveApiBase}/v1/register`, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      data: {
        organizationName: `Live Trial Local Org ${suffix}`,
        adminEmail: email,
        adminDisplayName: "Live Trial Local Admin",
      },
    });

    expect(orgRes.status(), await orgRes.text()).toBe(201);
  });

  test("ui: signup → verify → onboarding → sample run → manifest (DevelopmentBypass)", async ({ page, request }) => {
    test.setTimeout(240_000);
    test.skip(liveAuthMode !== "bypass", "Requires DevelopmentBypass auth (default ui-e2e-live API).");

    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const adminEmail = `trial-ui-${suffix}@example.com`;
    const orgName = `Trial UI Org ${suffix}`;

    await page.goto("/signup");
    await page.getByLabel(/^Work email$/i).fill(adminEmail);
    await page.getByLabel(/^Full name$/i).fill("Trial UI User");
    await page.getByLabel(/^Organization name$/i).fill(orgName);
    await page.getByRole("button", { name: /Create trial workspace/i }).click();

    await page.waitForURL(/\/signup\/verify/i, { timeout: 60_000 });

    const rawSession = await page.evaluate(() => window.sessionStorage.getItem("archlucid_last_registration") ?? "");
    const parsed = JSON.parse(rawSession) as {
      tenantId: string;
      defaultWorkspaceId: string;
      defaultProjectId: string;
    };

    expect(parsed.tenantId.length).toBeGreaterThan(0);

    await page.setExtraHTTPHeaders({
      "x-tenant-id": parsed.tenantId,
      "x-workspace-id": parsed.defaultWorkspaceId,
      "x-project-id": parsed.defaultProjectId,
    });

    await page.getByTestId("signup-verify-continue-onboarding").click();
    await page.waitForURL(/\/onboarding\/start/i, { timeout: 60_000 });

    const sampleLink = page.getByTestId("onboarding-open-sample-run");
    await expect(sampleLink).toBeVisible({ timeout: 120_000 });

    const sampleHref = (await sampleLink.getAttribute("href")) ?? "";
    expect(sampleHref).toMatch(/^\/runs\//);

    const deadline = Date.now() + 120_000;
    let sawTrialProvisioned = false;

    while (Date.now() < deadline) {
      const rows = await searchAudit(request, {
        eventType: "TrialProvisioned",
        tenantId: parsed.tenantId,
        workspaceId: parsed.defaultWorkspaceId,
        projectId: parsed.defaultProjectId,
        take: "50",
      });

      if (rows.some((r) => r.eventType === "TrialProvisioned")) {
        sawTrialProvisioned = true;
        break;
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(sawTrialProvisioned, "TrialProvisioned audit should appear after demo seed completes.").toBe(true);

    const selfReg = await searchAudit(request, {
      eventType: "TenantSelfRegistered",
      tenantId: parsed.tenantId,
      workspaceId: parsed.defaultWorkspaceId,
      projectId: parsed.defaultProjectId,
      take: "50",
    });

    expect(selfReg.some((e) => e.eventType === "TenantSelfRegistered")).toBe(true);

    await sampleLink.click();

    await expect(page.getByRole("heading", { name: "Run detail", level: 2 })).toBeVisible({ timeout: 120_000 });

    await expect(page.getByText(/Loading run detail/i)).toHaveCount(0, { timeout: 120_000 });

    const manifestLink = page.locator("main").locator('a[href^="/manifests/"]').first();

    await expect(
      manifestLink,
      "Seeded sample run should expose a golden manifest link once summaries hydrate.",
    ).toBeVisible({ timeout: 120_000 });

    await manifestLink.click();

    const manifestMain = page.locator("main");

    await expect(manifestMain.getByText(/Fetching manifest summary and artifacts/i)).toHaveCount(0, {
      timeout: 120_000,
    });

    await expect(manifestMain.getByRole("heading", { name: "Manifest", level: 2 })).toBeVisible({ timeout: 120_000 });
  });
});
