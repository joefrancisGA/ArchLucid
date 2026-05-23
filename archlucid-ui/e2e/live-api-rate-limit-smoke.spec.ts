/**
 * Optional live API smoke: assert rate-limit responses use Problem Details shape.
 * Skips when LIVE_API_URL is unset (same gate as other live-api specs).
 */
import { expect, test } from "@playwright/test";

import { liveApiBase } from "./helpers/live-api-client";

test.describe("live API rate limit smoke", () => {
  test.skip(!process.env.LIVE_API_URL, "LIVE_API_URL is required for live API smoke tests");

  test("429 responses expose application/problem+json with rate-limit-exceeded type", async ({ request }) => {
    const base = liveApiBase();
    let saw429 = false;

    for (let i = 0; i < 120; i++) {
      const response = await request.get(`${base}/health/live`);

      if (response.status() !== 429) {
        continue;
      }

      saw429 = true;
      const contentType = response.headers()["content-type"] ?? "";
      expect(contentType).toContain("application/problem+json");

      const body = (await response.json()) as { type?: string; status?: number; title?: string };
      expect(body.status).toBe(429);
      expect(body.type).toContain("rate-limit-exceeded");
      expect(body.title?.length ?? 0).toBeGreaterThan(0);
      break;
    }

    test.info().annotations.push({
      type: "note",
      description: saw429
        ? "Observed a 429 with Problem Details during burst probe."
        : "No 429 observed — limits may be high for this environment; shape not verified this run.",
    });
  });
});
