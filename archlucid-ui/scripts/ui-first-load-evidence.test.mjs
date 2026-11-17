import test from "node:test";
import assert from "node:assert/strict";
import { summarizeFirstLoadEvidence } from "./ui-first-load-evidence.mjs";

const baseline = {
  regressionToleranceKb: 25,
  routes: {
    "/": { firstLoadJsKb: 100 },
    "/welcome": { firstLoadJsKb: 200 },
    "/architecture/reviews": { firstLoadJsKb: 300 },
  },
};

test("exposes actual route regressions and shared chunks without changing budgets", () => {
  const report = summarizeFirstLoadEvidence([
    { route: "/page", firstLoadUncompressedJsBytes: 130 * 1024,
      firstLoadChunkPaths: ["static/common.js", "static/root.js", "static/common.js"] },
    { route: "/welcome/page", firstLoadUncompressedJsBytes: 224 * 1024,
      firstLoadChunkPaths: ["static/common.js", "static/welcome.js"] },
    { route: "/architecture/reviews/page", firstLoadUncompressedJsBytes: 310 * 1024 },
  ], baseline);
  assert.equal(report.overBudgetRouteCount, 1);
  assert.equal(report.routes.find(x => x.route === "/")?.status, "OVER_BUDGET");
  assert.equal(report.routes.find(x => x.route === "/welcome")?.status, "WITHIN_BUDGET");
  assert.equal(report.routes.find(x => x.route === "/architecture/reviews")?.chunkPathsAvailable, false);
  assert.deepEqual(report.commonChunks, [{ path: "static/common.js", routeCount: 2, routes: ["/", "/welcome"] }]);
  assert.ok(report.missingRouteCount > 0, "missing routes must not be called passing");
});

test("missing or malformed evidence never produces a false PASS", () => {
  const report = summarizeFirstLoadEvidence([
    { route: "/page", firstLoadUncompressedJsBytes: Number.NaN },
    { route: "/welcome/page", firstLoadUncompressedJsBytes: -1 },
  ], baseline);
  assert.equal(report.overBudgetRouteCount, 0);
  assert.equal(report.missingRouteCount, report.routes.length);
  assert.ok(report.routes.every(x => x.status === "MISSING_EVIDENCE"));
  assert.throws(() => summarizeFirstLoadEvidence({}, baseline), /Invalid/);
  assert.throws(() => summarizeFirstLoadEvidence([], { routes: {}, regressionToleranceKb: -1 }), /Invalid/);
});
