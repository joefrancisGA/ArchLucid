import { describe, expect, it } from "vitest";

import {
  PROCUREMENT_HELP_JOB_MATRIX,
  PROCUREMENT_HELP_JOB_MATRIX_HEADING,
} from "@/lib/procurement-help-ia-dual";
import {
  PROCUREMENT_HELP_RELATED_GUIDES,
  procurementHelpRelatedGuides,
} from "@/lib/procurement-help-related-guides";
import { SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX } from "@/lib/specialty-help-chrome-below-50-inventory";

describe("procurement help ia-dual and related guides (TB-2274 / TB-2275)", () => {
  it("keeps a three-row job matrix with procurement FAQ marked current", () => {
    expect(PROCUREMENT_HELP_JOB_MATRIX_HEADING).toContain("procurement questionnaire");
    expect(PROCUREMENT_HELP_JOB_MATRIX).toHaveLength(3);
    expect(PROCUREMENT_HELP_JOB_MATRIX.filter((row) => row.isCurrent === true)).toHaveLength(1);
    expect(PROCUREMENT_HELP_JOB_MATRIX.some((row) => row.href === "/help/security-trust")).toBe(true);
    expect(PROCUREMENT_HELP_JOB_MATRIX.some((row) => row.href === "/help/soc2-self-assessment")).toBe(true);
  });

  it("caps related guides at the specialty chrome contract", () => {
    expect(procurementHelpRelatedGuides()).toHaveLength(SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX);
    expect(PROCUREMENT_HELP_RELATED_GUIDES.some((guide) => guide.href === "/help/dpa-template")).toBe(true);
    expect(PROCUREMENT_HELP_RELATED_GUIDES.some((guide) => guide.href === "/help/procurement")).toBe(false);
  });
});
