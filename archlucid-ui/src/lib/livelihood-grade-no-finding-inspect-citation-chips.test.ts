import { describe, expect, it } from "vitest";

import {
  LIVELIHOOD_GRADE_NO_FINDING_INSPECT_CITATION_CHIP_HELPER,
  LIVELIHOOD_GRADE_NO_FINDING_INSPECT_CITATION_CHIP_LABEL,
} from "@/lib/livelihood-grade-no-finding-inspect-citation-chips";

describe("livelihood-grade-no finding inspect citation chips (LN-028)", () => {
  it("documents citation chip copy for decision-grade finding inspect", () => {
    expect(LIVELIHOOD_GRADE_NO_FINDING_INSPECT_CITATION_CHIP_LABEL).toMatch(/citation/i);
    expect(LIVELIHOOD_GRADE_NO_FINDING_INSPECT_CITATION_CHIP_HELPER).toMatch(/passage-backed/i);
    expect(LIVELIHOOD_GRADE_NO_FINDING_INSPECT_CITATION_CHIP_HELPER).toMatch(/Career-hard/i);
  });
});
