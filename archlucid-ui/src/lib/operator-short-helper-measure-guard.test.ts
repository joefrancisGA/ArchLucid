import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_PREMATURE_MEASURE_PATTERN,
  OPERATOR_SHORT_HELPER_MEASURE_GUARDED_SOURCES,
  OPERATOR_SHORT_HELPER_MEASURE_RESIDUAL_ALLOWLIST,
} from "@/lib/operator-short-helper-measure-inventory";

describe("operator short helper measure guard (TB-2041)", () => {
  it("documents residual allowlist entries for intentional reading measure", () => {
    expect(OPERATOR_SHORT_HELPER_MEASURE_RESIDUAL_ALLOWLIST.length).toBeGreaterThan(0);
    expect(OPERATOR_SHORT_HELPER_MEASURE_RESIDUAL_ALLOWLIST).toContain("src/app/(operator)/help/**");
  });

  it("keeps Overview, shared page chrome, and representative hub intros free of premature measure caps", () => {
    const violations: string[] = [];

    for (const relativePath of OPERATOR_SHORT_HELPER_MEASURE_GUARDED_SOURCES) {
      const absolutePath = join(process.cwd(), relativePath);
      expect(existsSync(absolutePath), `${relativePath} must exist`).toBe(true);

      const source = readFileSync(absolutePath, "utf8");

      if (OPERATOR_PREMATURE_MEASURE_PATTERN.test(source)) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});
