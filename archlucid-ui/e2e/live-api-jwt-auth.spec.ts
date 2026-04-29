/**
 * Production-like **JWT Bearer** gates (local RSA key in CI). Skipped unless `LIVE_JWT_TOKEN` is set.
 * See `docs/LIVE_E2E_JWT_SETUP.md`, `docs/LIVE_E2E_AUTH_ASSUMPTIONS.md`.
 */
import { expect, test } from "@playwright/test";

import {
  isJwtMode,
  liveApiBase,
  liveAcceptHeaders,
  liveAuthActorName,
  liveBearerAcceptHeaders,
  liveJsonHeaders,
} from "./helpers/live-api-client";

test.describe("live-api-jwt-auth", () => {
  test.skip(!isJwtMode, "Set LIVE_JWT_TOKEN to run JWT auth production-like gates.");

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(`Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}).`);
    }
  });

  test("health/ready allows anonymous access (200 without Authorization)", async ({ request }) => {
    const res = await request.get(`${liveApiBase}/health/ready`, {
      headers: { Accept: "application/json" },
    });

    expect(res.status()).toBe(200);
  });

  test("GET /v1/architecture/runs without bearer returns 401", async ({ request }) => {
    const res = await request.get(`${liveApiBase}/v1/architecture/runs`, {
      headers: liveBearerAcceptHeaders(""),
    });

    expect(res.status()).toBe(401);
  });

  test("GET /v1/architecture/runs with invalid bearer returns 401", async ({ request }) => {
    const res = await request.get(`${liveApiBase}/v1/architecture/runs`, {
      headers: liveBearerAcceptHeaders("definitely-not-a-valid-jwt"),
    });

    expect(res.status()).toBe(401);
  });

  test("GET /v1/architecture/runs with valid JWT returns 200", async ({ request }) => {
    const res = await request.get(`${liveApiBase}/v1/architecture/runs`, {
      headers: liveAcceptHeaders(),
    });

    expect(res.status()).toBe(200);
  });

  test("POST /v1/architecture/request with valid JWT creates a run", async ({ request }) => {
    const res = await request.post(`${liveApiBase}/v1/architecture/request`, {
      headers: liveJsonHeaders(),
      data: {
        requestId: `E2E-JWT-${Date.now()}`,
        description: "Live E2E JWT auth create run".padEnd(80, " "),
        systemName: "JwtAuthGate",
        environment: "prod",
        cloudProvider: 1,
        constraints: [] as string[],
        requiredCapabilities: ["SQL"],
        assumptions: [] as string[],
        priorManifestVersion: null as string | null,
      },
    });

    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(300);
    const body = (await res.json()) as { run?: { runId?: string } };

    expect(body.run?.runId).toBeTruthy();
  });

  test("soft: audit search after run lists actor aligned with JWT name claim", async ({ request }) => {
    const create = await request.post(`${liveApiBase}/v1/architecture/request`, {
      headers: liveJsonHeaders(),
      data: {
        requestId: `E2E-JWT-AUDIT-${Date.now()}`,
        description: "Live E2E JWT audit actor".padEnd(80, " "),
        systemName: "JwtAuditActor",
        environment: "prod",
        cloudProvider: 1,
        constraints: [] as string[],
        requiredCapabilities: ["SQL"],
        assumptions: [] as string[],
        priorManifestVersion: null as string | null,
      },
    });

    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { run?: { runId?: string } };
    const runId = created.run?.runId;

    expect(runId).toBeTruthy();

    const search = await request.get(`${liveApiBase}/v1/audit/search`, {
      params: { runId: runId!, take: "50" },
      headers: liveAcceptHeaders(),
    });

    expect(search.ok()).toBeTruthy();
    const envelope = (await search.json()) as { items?: { actorUserName?: string }[] };
    const rows = envelope.items ?? [];

    const match = rows.some(
      (r) =>
        typeof r.actorUserName === "string" &&
        r.actorUserName.trim().toLowerCase() === liveAuthActorName.trim().toLowerCase(),
    );

    expect.soft(match, `expected an audit row with actorUserName=${liveAuthActorName}`).toBe(true);
  });
});
