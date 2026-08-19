import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  buildArchitectureWorkspaceTabHref,
  readArchitectureWorkspaceTabFromHref,
  resolveArchitectureWorkspaceTabFromHash,
} from "@/lib/architecture/architecture-workspace-tabs";
import {
  RUN_DETAIL_CREATE_HOME_ACTIVITY_ORIENTATION_LEAD,
  RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY,
} from "@/lib/runs/run-detail-create-home-activity-copy";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CREATE_HOME_ACTIVITY_BAND_TEST_FILES = [
  "src/lib/architecture/architecture-workspace-tabs.test.ts",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeActivityPanel.test.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeActivity.test.ts",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/resolve-review-package-do-this-next.test.ts",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailGovernanceDecisionSection.test.tsx",
] as const;

const REA_TRAFFIC_HONESTY_PHRASES = [
  "Create-home-only",
  "ignored on committed ReviewDetailWorkspace",
  "reviewTab=activity",
  "cannot improve further toward 80",
] as const;

describe("create-home activity band regression (TB-1835)", () => {
  it("keeps sibling Vitest guards for TB-1831 through TB-1834 on disk", () => {
    for (const relativePath of CREATE_HOME_ACTIVITY_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors REA traffic honesty for create-home-only archTab=activity (TB-1831)", () => {
    const rea = findUiRouteTrafficRow("REA");

    expect(rea).toBeDefined();
    expect(rea?.path).toBe("/architecture/reviews/[reviewId]?archTab=activity");
    expect(rea?.section).toBe("Tab surface");

    for (const phrase of REA_TRAFFIC_HONESTY_PHRASES) {
      expect(rea?.note, phrase).toContain(phrase);
    }

    expect(rea?.note).toContain("TB-1831");
  });

  it("builds activity archTab hrefs without forcing create intent unless opted in (TB-1833)", () => {
    const href = buildArchitectureWorkspaceTabHref("run-rea", "activity");

    expect(href).toBe("/architecture/reviews/run-rea?archTab=activity");
    expect(href).not.toContain("fromGeneration=1");
    expect(href).not.toContain("intent=create-architecture");

    const withIntent = buildArchitectureWorkspaceTabHref("run-rea", "activity", {
      includeCreateIntent: true,
    });

    expect(withIntent).toContain("archTab=activity");
    expect(withIntent).toContain("fromGeneration=1");
    expect(withIntent).toContain("intent=create-architecture");
  });

  it("resolves activity from legacy hash and archTab search param", () => {
    expect(resolveArchitectureWorkspaceTabFromHash("architecture-assessment-progress")).toBe("activity");
    expect(readArchitectureWorkspaceTabFromHref("/architecture/reviews/run-1?archTab=activity")).toBe(
      "activity",
    );
  });

  it("keeps orientation and technical-detail copy for blank Activity states (TB-1832)", () => {
    expect(RUN_DETAIL_CREATE_HOME_ACTIVITY_ORIENTATION_LEAD).toMatch(/assessment progress/i);
    expect(RUN_DETAIL_CREATE_HOME_ACTIVITY_TECHNICAL_DETAIL_SUMMARY).toBe("Technical detail");
  });
});
