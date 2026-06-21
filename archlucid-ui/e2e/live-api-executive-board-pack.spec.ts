/**
 * TB-299: live API board-pack download + executive summary contract fields.
 * Requires ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 */
import { expect, test } from "@playwright/test";

import { liveApiBase, liveAcceptHeaders } from "./helpers/live-api-client";

test.describe("live-api-executive-board-pack", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("executive summary exposes orphan + freshness fields; board-pack markdown downloads", async ({ request }) => {
    const summaryRes = await request.get(`${liveApiBase}/v1/roi/executive-summary`, {
      headers: liveAcceptHeaders(),
      timeout: 60_000,
    });

    expect(summaryRes.ok(), `executive-summary expected 2xx, got ${summaryRes.status()}`).toBe(true);

    const summary = (await summaryRes.json()) as Record<string, unknown>;

    expect(summary).toHaveProperty("orphanCandidates");
    expect(summary).toHaveProperty("costEvidenceFreshnessStatus");

    const boardPackRes = await request.get(`${liveApiBase}/v1/roi/executive-summary/board-pack`, {
      headers: liveAcceptHeaders(),
      timeout: 60_000,
    });

    expect(boardPackRes.ok(), `board-pack expected 2xx, got ${boardPackRes.status()}`).toBe(true);

    const contentType = boardPackRes.headers()["content-type"] ?? "";

    expect(contentType.includes("markdown"), `board-pack content-type should be markdown, got ${contentType}`).toBe(
      true,
    );

    const body = await boardPackRes.text();

    expect(body).toContain("# Executive ROI — Board Pack");
    expect(body.toLowerCase()).not.toContain("demo run");
    expect(body).not.toContain("Simulator-only");
  });

  test("portfolio-summary analytics deduplicates findings across mocked runs", async ({ request }) => {
    const portfolioRes = await request.get(`${liveApiBase}/v1/analytics/roi/portfolio-summary`, {
      headers: liveAcceptHeaders(),
      timeout: 60_000,
    });

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
