/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test -c playwright.live.config.ts
 */
import { expect, test } from "@playwright/test";

import {
  assignPolicyPack,
  createPolicyPack,
  getEffectivePolicyPacks,
  listRecentAudit,
  liveApiBase,
  minimalPolicyPackContentJson,
} from "./helpers/live-api-client";

test.describe("live-api-policy-pack-lifecycle", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("create → assign → effective set → UI policy packs → audit PolicyPackCreated", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const complianceKey = `e2e-live-${Date.now()}`;
    const contentJson = minimalPolicyPackContentJson(complianceKey);
    const packName = `E2E Live Pack ${Date.now()}`;

    const { policyPackId } = await createPolicyPack(request, {
      name: packName,
      description: "live E2E policy pack",
      packType: "ProjectCustom",
      initialContentJson: contentJson,
    });

    test.info().annotations.push({ type: "policy-pack-id", description: policyPackId });

    await assignPolicyPack(request, policyPackId, { version: "1.0.0" });

    const effective = await getEffectivePolicyPacks(request);
    const match = effective.packs?.find((p) => p.policyPackId === policyPackId);

    expect(match, "created pack should appear in effective set").toBeTruthy();
    expect(match?.version).toBe("1.0.0");

    await page.goto("/policy-packs");
    await expect(page.getByRole("heading", { name: /policy packs/i }).first()).toBeVisible({
      timeout: 60_000,
    });

    await expect.soft(page.getByText(packName, { exact: false }).first()).toBeVisible({
      timeout: 30_000,
    });

    const auditRows = await listRecentAudit(request, 200);
    const created = auditRows.some((r) => r.eventType === "PolicyPackCreated");

    expect(created, "audit should include PolicyPackCreated").toBe(true);
  });
});
