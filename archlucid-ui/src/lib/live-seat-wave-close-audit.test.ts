import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");

describe("live-seat wave close audit (LS-024)", () => {
  it("includes acceptance doc with done-test evidence table", () => {
    const acceptancePath = join(REPO_ROOT, "docs/architecture/LIVE_SEAT_ACCEPTANCE_2026-09-20.md");
    const markdown = readFileSync(acceptancePath, "utf8");

    expect(markdown).toContain("LIVE_SEAT_COMPOSER_PROMPTS.md");
    expect(markdown).toContain("live-seat-first-login-matrix.test.ts");
    expect(markdown).toContain("Training is not Practice");
  });
});
