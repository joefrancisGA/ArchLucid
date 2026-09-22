import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_INVENTORY_DOC_PATH,
  LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS,
} from "@/lib/livelihood-grade-no-extraction-provenance-inventory";

const REPO_ROOT = join(process.cwd(), "..");

describe("livelihood-grade-no extraction provenance inventory (LN-003)", () => {
  it("documents extraction provenance gaps for LN-005 follow-up", () => {
    const markdown = readFileSync(
      join(REPO_ROOT, LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_INVENTORY_DOC_PATH),
      "utf8",
    );

    expect(LIVELIHOOD_GRADE_NO_EXTRACTION_PROVENANCE_ROWS.length).toBeGreaterThanOrEqual(3);
    expect(markdown).toContain("LN-003");
    expect(markdown).toContain("LN-005");
    expect(markdown).toContain("NotVerifiable");
  });
});
