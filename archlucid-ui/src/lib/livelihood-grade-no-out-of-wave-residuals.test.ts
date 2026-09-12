import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUAL_ROWS,
  LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUALS_DOC_PATH,
} from "@/lib/livelihood-grade-no-out-of-wave-residuals";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no out-of-wave residuals (LN-025 / LN-026 / LN-035)", () => {
  it("documents explicit skips for judge default-on, G-REAL-06, and density predicate rewrite", () => {
    const markdown = readFileSync(join(REPO_ROOT, LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUALS_DOC_PATH), "utf8");

    for (const prompt of ["LN-025", "LN-026", "LN-035"]) {
      const row = LIVELIHOOD_GRADE_NO_OUT_OF_WAVE_RESIDUAL_ROWS.find((entry) => entry.ownerPrompt === prompt);

      expect(row, prompt).toBeDefined();
      expect(row?.status).toBe("not-shipped");
    }

    expect(markdown).toContain("Not shipped");
    expect(markdown).toContain("## Do not claim");
  });
});
