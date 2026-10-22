import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE_PATH = join(
  process.cwd(),
  "src/components/architecture/ArchitectureIdentityDeskSealedReceiptStrip.tsx",
);

describe("ArchitectureIdentityDeskSealedReceiptStrip (SG-023 / LY-072)", () => {
  it("keeps sealed decision receipt export on the architecture desk", () => {
    const source = readFileSync(SOURCE_PATH, "utf8");

    expect(source).toContain("SG-023");
    expect(source).toContain("architecture-identity-desk-sealed-receipt-strip");
    expect(source).toContain("DecisionReceiptExportButton");
    expect(source).toMatch(/decision receipt/i);
  });
});
