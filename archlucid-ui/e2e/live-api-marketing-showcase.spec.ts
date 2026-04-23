/**
 * Live API: anonymous marketing showcase bundle for Contoso baseline (requires demo seed + IsPublicShowcase flag).
 */
import { expect, test } from "@playwright/test";

import { liveApiBase, liveJsonHeaders } from "./helpers/live-api-client";

test.describe("live-api-marketing-showcase", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }

    const seed = await request.post(`${liveApiBase}/v1/demo/seed`, {
      headers: liveJsonHeaders(),
      timeout: 60_000,
    });

    const seedStatus = seed.status();
    const seedAcceptable = seedStatus === 204 || seedStatus === 400 || seedStatus === 403 || seedStatus === 404;

    if (!seedAcceptable) {
      const body = await seed.text();
      throw new Error(`POST /v1/demo/seed unexpected status ${seedStatus}: ${body.slice(0, 500)}`);
    }
  });

  test("GET marketing showcase contoso-baseline returns JSON or 404", async ({ request }) => {
    const response = await request.get(`${liveApiBase}/v1/marketing/showcase/contoso-baseline`, {
      headers: liveJsonHeaders(),
      timeout: 60_000,
    });

    const acceptable = response.status() === 200 || response.status() === 404;
    expect(acceptable, `unexpected status ${response.status()}`).toBeTruthy();

    if (response.status() === 200) {
      const body = (await response.json()) as { run?: { runId?: string } };
      expect(body.run?.runId).toBeTruthy();
    }
  });
});
