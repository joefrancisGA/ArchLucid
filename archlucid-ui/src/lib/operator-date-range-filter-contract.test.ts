import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";

const BANNED_RANGE_LABELS = ["Recorded after", "Recorded before"] as const;

/** High-traffic operator date-range filter surfaces (TB-2013 / TB-2014 apply). */
const DATE_RANGE_FILTER_SURFACE_PATHS = [
  "src/app/(operator)/governance/decision-register/DecisionRegisterFiltersPanel.tsx",
  "src/app/(operator)/governance/audit/_sections/AuditSearchSection.tsx",
  "src/app/(operator)/insights/sponsor-report/_sections/PilotValueReportPageView.tsx",
] as const;

function readUiSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function linesWithBannedRangeLabels(source: string): string[] {
  const violations: string[] = [];

  for (const line of source.split("\n")) {
    for (const banned of BANNED_RANGE_LABELS) {
      if (line.includes(banned)) {
        violations.push(line.trim());
      }
    }
  }

  return violations;
}

describe("operator-date-range-filter-contract (TB-2015)", () => {
  it("uses canonical Start date / End date labels from operator-date-range-copy (TB-2012)", () => {
    expect(OPERATOR_DATE_RANGE_START_LABEL).toBe("Start date");
    expect(OPERATOR_DATE_RANGE_END_LABEL).toBe("End date");
  });

  it.each(DATE_RANGE_FILTER_SURFACE_PATHS)(
    "%s imports canonical date-range copy and avoids Recorded after/before labels",
    (relativePath) => {
      expect(existsSync(join(process.cwd(), relativePath))).toBe(true);

      const source = readUiSource(relativePath);

      expect(source).toContain("operator-date-range-copy");
      expect(source).toContain("OPERATOR_DATE_RANGE_START_LABEL");
      expect(source).toContain("OPERATOR_DATE_RANGE_END_LABEL");
      expect(linesWithBannedRangeLabels(source), relativePath).toEqual([]);
    },
  );

  it("keeps Decision Register filter panel regression coverage (TB-2013)", () => {
    const panelTestSource = readUiSource(
      "src/app/(operator)/governance/decision-register/DecisionRegisterFiltersPanel.test.tsx",
    );

    expect(panelTestSource).toContain("TB-2013");
    expect(panelTestSource).toContain("OPERATOR_DATE_RANGE_START_LABEL");
    expect(panelTestSource).toContain('queryByText("Recorded after")');
    expect(panelTestSource).toContain('queryByText("Recorded before")');
  });
});
