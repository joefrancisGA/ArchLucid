import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("v10 quality-ROI QR-16 close audit", () => {
  it("documents acceptance markdown and v10 inventory module", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/V10_QUALITY_ROI_QR16_ACCEPTANCE_2026-09-12.md"),
      "utf8",
    );
    const inventory = readFileSync(
      join(REPO_ROOT, "docs/architecture/V10_QUALITY_ROI_INVENTORY.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/OpenApiContractSnapshotTests/);
    expect(acceptance).toMatch(/inventory-binding/);
    expect(acceptance).toMatch(/DX-77/);

    expect(inventory).toContain("v10-quality-roi-inventory.ts");
    expect(inventory).toContain("QR-16");
    expect(inventory).toContain("update_openapi_contract_snapshot.sh");
  });
});
