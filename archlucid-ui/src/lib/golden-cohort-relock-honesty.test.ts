import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1173: buyer copy must not treat cohort re-lock as production ManifestHash heal. */
describe("golden-cohort re-lock honesty guard (TB-1173)", () => {
  it("re-lock contract forbids cohort heal and rubber-stamp smells", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "docs/library/GOLDEN_COHORT_RELOCK_VS_RUBBER_STAMP_CONTRACT.md",
      ),
      "utf8",
    );

    expect(source).toContain("TB-1173");
    expect(source).toMatch(/rubber stamp/i);
    expect(source).toMatch(/Never re-lockable/i);
  });

  it("public claim boundary guide cites re-lock honesty for M-201", () => {
    const source = readFileSync(
      join(REPO_ROOT, "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
      "utf8",
    );

    expect(source).toMatch(/Golden-cohort re-lock/i);
    expect(source).toMatch(/M-201/i);
    expect(source).not.toMatch(
      /cohort re-lock heals production manifesthash in production/i,
    );
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "scripts/ci/check_golden_cohort_relock_rubber_stamp_honesty.py",
      ),
      "utf8",
    );

    expect(source).toContain("TB-1173");
    expect(source).toContain("cohort re-lock heals production");
  });
});
