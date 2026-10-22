import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1025: buyer drift copy must not equate artifact replay or UI side-by-side with verify. */
describe("comparison replay drift honesty guard (TB-1025)", () => {
  it("why comparison row does not claim artifact replay proves architecture unchanged", () => {
    const source = readFileSync(join(process.cwd(), "src/lib/why-comparison.ts"), "utf8");

    expect(source).not.toMatch(/artifact replay proves architecture unchanged/i);
    expect(source).not.toMatch(/side-by-side equals verify/i);
    expect(source).toContain("detect drift");
  });

  it("comparison replay help cites verify for drift verification", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/comparison-replay-help-guide-content.ts"),
      "utf8",
    );

    expect(source).toMatch(/verify/i);
    expect(source).not.toMatch(/artifact replay proves architecture unchanged/i);
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_comparison_replay_drift_honesty.py"),
      "utf8",
    );

    expect(source).toContain("TB-1025");
    expect(source).toContain("artifact-mode replay proves architecture is unchanged");
  });
});
