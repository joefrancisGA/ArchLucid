import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("evidence-source-inspect stored-file controls ratchet (ESI-03 / ESI-08)", () => {
  it("inventory section test requires open/download for stored catalog files only", () => {
    const testSource = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/components/runs/RunDetailEvidenceInventorySection.test.tsx"),
      "utf8",
    );

    expect(testSource).toMatch(/open and download controls for stored catalog files only/i);
    expect(testSource).toMatch(/getByRole\("button", \{ name: "Download network-topology\.png"/);
    expect(testSource).toMatch(/queryByRole\("button", \{ name: "Download storageAccount\.bicep"/);
  });

  it("citation rows stay non-downloadable in inventory builder", () => {
    const inventory = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/runs/run-detail-evidence-inventory.ts"),
      "utf8",
    );

    expect(inventory).toMatch(/inventoryKind/);
    expect(inventory).toMatch(/stored-file/);
    expect(inventory).toMatch(/citation/);
  });
});
