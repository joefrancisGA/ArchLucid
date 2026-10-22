import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1035: integrator copy must not teach dual-default lifecycle or /result-as-finalize. */
describe("strangler next-slice honesty guard (TB-1035)", () => {
  it("strangler contract forbids dual coordinator storage still ships", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "docs/library/STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md",
      ),
      "utf8",
    );

    expect(source).toContain("TB-1035");
    expect(source).toMatch(/Dual coordinator/i);
    expect(source).toMatch(/\/result/i);
  });

  it("public claim boundary guide cites strangler honesty for M-184", () => {
    const source = readFileSync(
      join(REPO_ROOT, "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
      "utf8",
    );

    expect(source).toMatch(/Strangler next slice/i);
    expect(source).toMatch(/Authority product-default/i);
    expect(source).not.toMatch(/dual coordinator storage still ships in production/i);
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_strangler_next_slice_honesty.py"),
      "utf8",
    );

    expect(source).toContain("TB-1035");
    expect(source).toContain("dual coordinator storage still ships");
  });
});
