import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1027: buyer copy must not pitch findings/decisions as the hireable unit or dual create/review products. */
describe("operator primary object honesty guard (TB-1027)", () => {
  it("operator home copy does not claim findings are the hireable unit", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/operator/operator-home-page-copy.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/findings are the hireable unit/i);
    expect(source).not.toMatch(/two equal products/i);
  });

  it("why-archlucid copy cites architecture package as primary CTA noun", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/why-archlucid-page-copy.ts"), "utf8");

    expect(source).toMatch(/architecture package/i);
    expect(source).not.toMatch(/findings are the product/i);
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_operator_primary_object_honesty.py"),
      "utf8",
    );

    expect(source).toContain("TB-1027");
    expect(source).toContain("create and review are two equal products");
  });
});
