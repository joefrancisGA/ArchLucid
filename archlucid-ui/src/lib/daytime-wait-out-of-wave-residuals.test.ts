import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DAYTIME_WAIT_OUT_OF_WAVE_RESIDUAL_ROWS } from "@/lib/daytime-wait-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("daytime-wait out-of-wave residuals (DW-018+)", () => {
  it("records run progress URL and Gate 1 as skips", () => {
    const items = DAYTIME_WAIT_OUT_OF_WAVE_RESIDUAL_ROWS.map((row) => row.item);

    expect(items).toContain("GET /v1/runs/{runId}/progress");
    expect(items).toContain("Gate 1 live review SLA");
  });

  it("documents residuals markdown for close audit", () => {
    const doc = readFileSync(
      join(REPO_ROOT, "docs/architecture/DAYTIME_WAIT_OUT_OF_WAVE_RESIDUALS.md"),
      "utf8",
    );

    expect(doc).toMatch(/DW-018/);
    expect(doc).toMatch(/operations/i);
  });
});
