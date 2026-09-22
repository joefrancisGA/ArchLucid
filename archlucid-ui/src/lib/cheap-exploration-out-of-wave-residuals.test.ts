import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CHEAP_EXPLORATION_OUT_OF_WAVE_RESIDUAL_ROWS } from "@/lib/cheap-exploration-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("cheap-exploration out-of-wave residuals (CE-017+)", () => {
  it("records draft-diff, chat, unseal, pay-per-session, and presence as skips", () => {
    const items = CHEAP_EXPLORATION_OUT_OF_WAVE_RESIDUAL_ROWS.map((row) => row.item);

    expect(items).toContain("Draft-to-draft Compare");
    expect(items).toContain("Finding-comment chat");
    expect(items).toContain("Unseal to sketch");
    expect(items).toContain("Live cursors / presence");
  });

  it("documents residuals markdown for close audit", () => {
    const doc = readFileSync(
      join(REPO_ROOT, "docs/architecture/CHEAP_EXPLORATION_OUT_OF_WAVE_RESIDUALS.md"),
      "utf8",
    );

    expect(doc).toMatch(/CE-017/);
    expect(doc).toMatch(/draft-diff/i);
  });
});
