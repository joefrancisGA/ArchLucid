import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runBuyerCtoDemoSmokeCheck } from "@/lib/buyer/buyer-cto-demo-smoke-check";

describe("runBuyerCtoDemoSmokeCheck", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks all steps ok when fetch returns 200", async () => {
    const results = await runBuyerCtoDemoSmokeCheck("https://demo.example");

    expect(results.length).toBe(6);
    expect(results.every((row) => row.ok)).toBe(true);
  });

  it("marks a step failed when fetch returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/insights/evidence-graph")) {
          return new Response(null, { status: 404 });
        }

        return new Response(null, { status: 200 });
      }),
    );

    const results = await runBuyerCtoDemoSmokeCheck("https://demo.example");
    const graphStep = results.find((row) => row.href.includes("/insights/evidence-graph"));

    expect(graphStep?.ok).toBe(false);
    expect(graphStep?.statusCode).toBe(404);
  });

  it("marks a step failed when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    const results = await runBuyerCtoDemoSmokeCheck("https://demo.example");

    expect(results.every((row) => row.ok === false)).toBe(true);
    expect(results.every((row) => row.statusCode === null)).toBe(true);
  });
});
