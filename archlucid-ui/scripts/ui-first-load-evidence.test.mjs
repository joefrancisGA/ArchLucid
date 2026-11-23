import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectFirstLoadChunkFileBytes, summarizeFirstLoadEvidence } from "./ui-first-load-evidence.mjs";

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

test("shared chunk file bytes are measured, not inferred from route totals", () => {
  const common = ".next/static/chunks/a-1.js";
  const heavy = ".next/static/chunks/z-1.js";
  const report = summarizeFirstLoadEvidence([
    { route: "/page", firstLoadUncompressedJsBytes: 130 * 1024, firstLoadChunkPaths: [common, heavy] },
    { route: "/welcome/page", firstLoadUncompressedJsBytes: 224 * 1024, firstLoadChunkPaths: [common, heavy] },
  ], baseline, new Map([[common, 1024], [heavy, 40960]]));
  assert.equal(report.overBudgetRouteCount, 1);
  assert.deepEqual(report.commonChunks.map(chunk => [chunk.path, chunk.chunkFileBytes, chunk.chunkFileKb]), [
    [heavy, 40960, 40],
    [common, 1024, 1],
  ]);
  assert.equal(report.commonChunks.every(chunk => chunk.routeCount === 2), true);
});

test("chunk byte collector rejects unsafe paths and never fabricates missing sizes", () => {
  const root = mkdtempSync(join(tmpdir(), "first-load-bytes-"));
  try {
    const chunkDir = join(root, ".next", "static", "chunks");
    mkdirSync(chunkDir, { recursive: true });
    writeFileSync(join(chunkDir, "verified-1.js"), "/* ten */x");
    const sized = collectFirstLoadChunkFileBytes([{
      firstLoadChunkPaths: [
        ".next/static/chunks/verified-1.js",
        ".next/static/chunks/missing.js",
        "../../secret.js",
        ".next/static/chunks/../secret.js",
      ],
    }], root);
    assert.equal(sized.get(".next/static/chunks/verified-1.js"), 11);
    assert.equal(sized.has(".next/static/chunks/missing.js"), false);
    assert.equal(sized.has("../../secret.js"), false);
    assert.equal(sized.has(".next/static/chunks/../secret.js"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
