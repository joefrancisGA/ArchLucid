import { describe, expect, it } from "vitest";

import {
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX,
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING,
} from "@/lib/configuration-reference-help-ia-dual";
import {
  CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES,
  configurationReferenceHelpRelatedGuides,
} from "@/lib/configuration-reference-help-related-guides";

describe("configuration-reference help ia-dual and related guides (TB-2271 / TB-2272)", () => {
  it("keeps a merged four-row job matrix with configuration reference marked current", () => {
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX_HEADING).toContain("Which guide");
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX).toHaveLength(4);
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.filter((row) => row.isCurrent === true)).toHaveLength(1);
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.some((row) => row.href === "/help/enterprise-onboarding")).toBe(
      true,
    );
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.some((row) => row.href === "/help/api-contracts")).toBe(true);
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.some((row) => row.href === "/help/authentication-sign-in")).toBe(
      true,
    );
    expect(CONFIGURATION_REFERENCE_HELP_JOB_MATRIX.every((row) => row.isCurrent === true || row.href !== undefined)).toBe(
      true,
    );
  });

  it("derives related guides from the merged matrix without duplicates", () => {
    expect(configurationReferenceHelpRelatedGuides()).toHaveLength(3);
    expect(
      CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES.some((guide) => guide.href === "/help/authentication-sign-in"),
    ).toBe(true);
    expect(
      CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES.some(
        (guide) => guide.href === "/help/configuration-reference",
      ),
    ).toBe(false);
  });
});
