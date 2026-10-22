import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1197: buyer copy must not sell unvalidated agent prose as the signed package. */
describe("unvalidated-proposal-overlay honesty guard (TB-1197)", () => {
  it("agent variance contract forbids prose-as-package and PilotStrict overlay overclaims", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "docs/library/AGENT_OUTPUT_DECISIONING_REAL_VARIANCE_ISOLATION_CONTRACT.md",
      ),
      "utf8",
    );

    expect(source).toContain("TB-1197");
    expect(source).toMatch(/Agent free text/i);
    expect(source).toMatch(/Validate-before-overlay/i);
  });

  it("public claim boundary guide cites overlay honesty for M-203", () => {
    const source = readFileSync(
      join(REPO_ROOT, "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
      "utf8",
    );

    expect(source).toMatch(/Agent→decisioning Real-variance/i);
    expect(source).toMatch(/M-203/i);
    expect(source).not.toMatch(
      /agent free text = signed package in production/i,
    );
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(
        REPO_ROOT,
        "scripts/ci/check_unvalidated_proposal_overlay_honesty.py",
      ),
      "utf8",
    );

    expect(source).toContain("TB-1197");
    expect(source).toContain("agent free text = signed package");
  });
});
