import { describe, expect, it } from "vitest";

import {
  ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX,
  ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING,
} from "@/lib/engineering-troubleshooting-help-ia-dual";
import {
  ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES,
  engineeringTroubleshootingHelpRelatedGuides,
} from "@/lib/engineering-troubleshooting-help-related-guides";
import { SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX } from "@/lib/specialty-help-chrome-below-50-inventory";

describe("engineering-troubleshooting help ia-dual and related guides (TB-2265 / TB-2266)", () => {
  it("keeps a three-row job matrix with the eng runbook marked current", () => {
    expect(ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX_HEADING).toContain("eng-depth runbook");
    expect(ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX).toHaveLength(3);
    expect(ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX.filter((row) => row.isCurrent === true)).toHaveLength(1);
    expect(ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX.some((row) => row.href === "/help/troubleshooting")).toBe(
      true,
    );
    expect(ENGINEERING_TROUBLESHOOTING_HELP_JOB_MATRIX.some((row) => row.href === "/help/admin-diagnostics")).toBe(
      true,
    );
  });

  it("caps related guides at the specialty chrome contract", () => {
    expect(engineeringTroubleshootingHelpRelatedGuides()).toHaveLength(SPECIALTY_HELP_CHROME_RELATED_GUIDES_MAX);
    expect(ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES.some((guide) => guide.href === "/help/cli-usage")).toBe(
      true,
    );
    expect(
      ENGINEERING_TROUBLESHOOTING_HELP_RELATED_GUIDES.some(
        (guide) => guide.href === "/help/engineering-troubleshooting",
      ),
    ).toBe(false);
  });
});
