import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_CREATE_HOME_FINDINGS_ACTIVITY_CTA_LABEL,
  RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD,
} from "@/lib/runs/run-detail-create-home-findings-copy";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CREATE_HOME_FINDINGS_BAND_TEST_FILES = [
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeFindingsPanel.test.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.create-home-empty.test.tsx",
  "src/components/QuickDecisionSummary.test.tsx",
] as const;

const REF_TRAFFIC_HONESTY_PHRASES = [
  "Create-home-only",
  "ignored on committed ReviewDetailWorkspace",
  "reviewTab=findings",
  "cannot improve further toward 80",
] as const;

describe("create-home findings band regression (TB-1855)", () => {
  it("keeps sibling Vitest guards for TB-1851 through TB-1854 on disk", () => {
    for (const relativePath of CREATE_HOME_FINDINGS_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors REF traffic honesty for create-home-only archTab=findings (TB-1851)", () => {
    const ref = findUiRouteTrafficRow("REF");

    expect(ref).toBeDefined();
    expect(ref?.path).toBe("/architecture/reviews/[reviewId]?archTab=findings");
    expect(ref?.section).toBe("Tab surface");

    for (const phrase of REF_TRAFFIC_HONESTY_PHRASES) {
      expect(ref?.note, phrase).toContain(phrase);
    }

    expect(ref?.note).toContain("create-home findings panel");
    expect(ref?.note).toContain("TB-1851");
  });

  it("keeps pre-finalize findings orientation copy (TB-1852)", () => {
    expect(RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD).toMatch(/draft assessment results/i);
    expect(RUN_DETAIL_CREATE_HOME_FINDINGS_ORIENTATION_LEAD).toMatch(/not a sealed review record/i);
    expect(RUN_DETAIL_CREATE_HOME_FINDINGS_ACTIVITY_CTA_LABEL).toBe("View assessment progress");
  });

  it("keeps create-home in-progress empty test id referenced by TB-1853 guard", () => {
    const quickDecisionSummaryTest = existsSync(
      join(UI_ROOT, "src/components/QuickDecisionSummary.test.tsx"),
    );

    expect(quickDecisionSummaryTest).toBe(true);
  });
});
