import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1031: welcome/marketing copy must not claim founder-narration-free 15-minute product-led paths. */
describe("first-15 package spine honesty guard (TB-1031)", () => {
  it("welcome marketing copy does not promise 15 minutes without founder narration", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/marketing/welcome-marketing-copy.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/15 minutes without founder narration/i);
    expect(source).not.toMatch(/product-led first value/i);
    expect(source).not.toMatch(/no se required/i);
  });

  it("cloud-neutral primary copy does not claim no-founder product-led first value", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/cloud-neutral-primary-copy.ts"), "utf8");

    expect(source).not.toMatch(/product-led first value/i);
    expect(source).not.toMatch(/without founder narration/i);
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_first_15_package_spine_honesty.py"),
      "utf8",
    );

    expect(source).toContain("TB-1031");
    expect(source).toContain("15 minutes without founder narration");
  });
});
