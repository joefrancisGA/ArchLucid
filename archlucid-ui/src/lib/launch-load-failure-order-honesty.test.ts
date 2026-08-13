import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

/** TB-1033: buyer docs must not equate API scale-out with AOAI TPM or claim launch load proven without drill. */
describe("launch-load failure-order honesty guard (TB-1033)", () => {
  it("public claim boundary guide cites TB-1032 for launch-load honesty", () => {
    const source = readFileSync(
      join(REPO_ROOT, "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
      "utf8",
    );

    expect(source).toMatch(/Launch-load failure order/i);
    expect(source).toMatch(/HTTP scale/i);
    expect(source).not.toMatch(/scale-out removes 429 for every/i);
  });

  it("launch-load contract forbids scale-out removes AOAI 429 phrasing", () => {
    const source = readFileSync(
      join(REPO_ROOT, "docs/library/LAUNCH_LOAD_FAILURE_ORDER_DEGRADATION_CONTRACT.md"),
      "utf8",
    );

    expect(source).toContain("TB-1033");
    expect(source).toMatch(/Scale-out removes AOAI 429/i);
  });

  it("CI guard script exists at repo root", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_launch_load_failure_order_honesty.py"),
      "utf8",
    );

    expect(source).toContain("TB-1033");
    expect(source).toContain("scale-out removes 429");
  });
});
