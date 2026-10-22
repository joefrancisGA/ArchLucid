/**
 * TB-299: live API board-pack download + sponsor report contract fields.
 * Requires ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 */
import { expect, test } from "@playwright/test";

import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import {
  getLiveApiPathWithTransientRetries,
  liveApiBase,
  liveE2eApiContractPlaywrightTimeoutMs,
} from "./helpers/live-api-client";

test.describe("live-api-sponsor-board-pack", { tag: ["@founder"] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("sponsor report exposes orphan + freshness fields; board-pack markdown downloads", async ({ request }) => {
    test.setTimeout(liveE2eApiContractPlaywrightTimeoutMs());

    const summaryRes = await getLiveApiPathWithTransientRetries(request, "/v1/roi/sponsor-report");

    expect(summaryRes.ok(), `sponsor-report expected 2xx, got ${summaryRes.status()}`).toBe(true);

    const summary = (await summaryRes.json()) as Record<string, unknown>;

    expect(summary).toHaveProperty("orphanCandidates");
    expect(summary).toHaveProperty("costEvidenceFreshnessStatus");

    const boardPackRes = await getLiveApiPathWithTransientRetries(request, "/v1/roi/sponsor-report/board-pack");

    expect(boardPackRes.ok(), `board-pack expected 2xx, got ${boardPackRes.status()}`).toBe(true);

    const contentType = boardPackRes.headers()["content-type"] ?? "";

    expect(contentType.includes("markdown"), `board-pack content-type should be markdown, got ${contentType}`).toBe(
      true,
    );

    const body = await boardPackRes.text();

    expect(body).toContain("# Sponsor ROI — Board Pack");
    expect(body.toLowerCase()).not.toContain("demo run");
    expect(body).not.toContain("Simulator-only");
  });

  test("portfolio-summary analytics deduplicates findings across mocked runs", async ({ request }) => {
    const portfolioRes = await getLiveApiPathWithTransientRetries(request, "/v1/analytics/roi/portfolio-summary");

    expect(portfolioRes.ok(), `portfolio-summary expected 2xx, got ${portfolioRes.status()}`).toBe(true);

    const portfolio = (await portfolioRes.json()) as {
      rawFindingCount?: number;
      uniqueFindingCount?: number;
      deduplicatedTotals?: { timeSavedHours?: number };
      rawRunTotals?: { timeSavedHours?: number };
    };

    expect(portfolio.rawFindingCount).toBe(5);
    expect(portfolio.uniqueFindingCount).toBe(3);
    expect(portfolio.deduplicatedTotals?.timeSavedHours).toBeLessThan(portfolio.rawRunTotals?.timeSavedHours ?? 0);
  });
});
