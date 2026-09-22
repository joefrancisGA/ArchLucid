import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_INVENTORY_DOC_PATH,
  LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS,
} from "@/lib/livelihood-grade-no-hard-infeasible-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no hard-infeasible inventory (LN-002)", () => {
  it("documents Working Career surfaces that require hard citations", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS.length).toBeGreaterThanOrEqual(4);
    expect(
      LIVELIHOOD_GRADE_NO_HARD_INFEASIBLE_ROWS.every((row) => row.citationRequiredOnWorkingCareerExport),
    ).toBe(true);

    expect(markdown).toContain("LN-002");
    expect(markdown).toContain("CareerArtifactCompletenessValidator");
    expect(markdown).toContain("LN-004");
  });
});
