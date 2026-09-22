import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("v8 quality-ROI wave close audit (QR-01–QR-05)", () => {
  it("documents acceptance markdown and ratchet inventory", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/V8_QUALITY_ROI_ACCEPTANCE_2026-09-12.md"),
      "utf8",
    );
    const inventory = readFileSync(
      join(REPO_ROOT, "docs/architecture/V8_QUALITY_ROI_INVENTORY.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/Decisioning\.Tests/);
    expect(acceptance).toMatch(/typed-engine-scored/);
    expect(acceptance).toMatch(/G-REAL-06/);

    expect(inventory).toContain("v8-quality-roi-inventory.ts");
    expect(inventory).toContain("check_insight_density_advisory_surfaces.py");
  });
});
