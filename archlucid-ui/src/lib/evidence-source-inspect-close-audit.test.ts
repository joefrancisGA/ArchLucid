import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("evidence-source-inspect wave close audit (ESI-08)", () => {
  it("documents acceptance markdown and catalog surfaces", () => {
    const acceptance = readFileSync(
      join(REPO_ROOT, "docs/architecture/EVIDENCE_SOURCE_INSPECT_ACCEPTANCE_2026-09-12.md"),
      "utf8",
    );
    const inventory = readFileSync(
      join(REPO_ROOT, "docs/architecture/EVIDENCE_SOURCE_INSPECT_INVENTORY.md"),
      "utf8",
    );

    expect(acceptance).toMatch(/Shipped/);
    expect(acceptance).toMatch(/preview/i);
    expect(acceptance).toMatch(/not the sealed review record/i);

    expect(inventory).toContain("RunStoredEvidenceFiles");
    expect(inventory).toContain("StoredEvidenceFileCells.tsx");
  });
});
