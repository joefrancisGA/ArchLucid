import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_BASELINE_RELATIVE_PATH,
  TRACKED_ROUTES,
  compareFirstLoadJsBudget,
  parseNextBuildFirstLoadJsKb,
  readBaseline,
} from "./first-load-js-baseline.mjs";

const FIXTURE_LOG = `
Route (app)                                             Size  First Load JS  Revalidate  Expire
├ ƒ /governance                                      34.9 kB         286 kB
├ ƒ /reviews                                         33.3 kB         287 kB
├ ƒ /reviews/[runId]                                  125 kB         421 kB
├ ○ /welcome                                         8.41 kB         145 kB          5m      1y
+ First Load JS shared by all                         105 kB
`;

describe("first-load-js-baseline (TB-573)", () => {
  it("parses First Load JS per route from Next.js build output", () => {
    const routes = parseNextBuildFirstLoadJsKb(FIXTURE_LOG);

    expect(routes.get("/welcome")).toBe(145);
    expect(routes.get("/reviews")).toBe(287);
    expect(routes.get("/reviews/[runId]")).toBe(421);
    expect(routes.get("/governance")).toBe(286);
  });

  it("passes when actual sizes are within baseline tolerance", () => {
    const actualRoutes = parseNextBuildFirstLoadJsKb(FIXTURE_LOG);
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const result = compareFirstLoadJsBudget(actualRoutes, baseline);

    expect(result.ok).toBe(true);
    expect(result.messages.some((message) => message.startsWith("FAIL:"))).toBe(false);
  });

  it("fails when /reviews exceeds baseline tolerance", () => {
    const actualRoutes = parseNextBuildFirstLoadJsKb(FIXTURE_LOG);
    actualRoutes.set("/reviews", 320);

    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const result = compareFirstLoadJsBudget(actualRoutes, baseline);

    expect(result.ok).toBe(false);
    expect(result.messages.some((message) => message.includes("/reviews"))).toBe(true);
  });

  it("keeps committed baseline aligned with tracked routes", () => {
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));

    for (const route of TRACKED_ROUTES) {
      expect(baseline.routes[route]?.firstLoadJsKb).toBeTypeOf("number");
    }

    const raw = readFileSync(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH), "utf8");
    expect(raw).toContain('"schemaVersion": 1');
  });
});
