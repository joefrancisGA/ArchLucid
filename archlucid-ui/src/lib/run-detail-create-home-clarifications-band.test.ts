import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { buildArchitectureCorrectionHref } from "@/lib/architecture/architecture-correction-href";
import { countOpenClarifications, countClarificationGaps } from "@/lib/architecture/architecture-open-clarifications-count";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CREATE_HOME_CLARIFICATIONS_BAND_TEST_FILES = [
  "src/components/architecture/ArchitectureCreatedClarificationsPanel.test.tsx",
  "src/lib/architecture/architecture-correction-href.test.ts",
  "src/lib/architecture/architecture-open-clarifications-count.test.ts",
  "src/lib/architecture/architecture-created-home-model.test.ts",
  "src/components/architecture/ArchitectureCreatedWorkspace.test.tsx",
] as const;

const REC_TRAFFIC_HONESTY_PHRASES = [
  "Create-home-only",
  "ignored on committed ReviewDetailWorkspace",
  "reviewTab only",
  "cannot improve further toward 80",
] as const;

describe("create-home clarifications band regression (TB-1840)", () => {
  it("keeps sibling Vitest guards for TB-1836 through TB-1839 on disk", () => {
    for (const relativePath of CREATE_HOME_CLARIFICATIONS_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors REC traffic honesty for create-home-only reviewTab=decisions-remediation (TB-1836)", () => {
    const rec = findUiRouteTrafficRow("REC");

    expect(rec).toBeDefined();
    expect(rec?.path).toBe("/architecture/reviews/[reviewId]?reviewTab=decisions-remediation");
    expect(rec?.section).toBe("Tab surface");

    for (const phrase of REC_TRAFFIC_HONESTY_PHRASES) {
      expect(rec?.note, phrase).toContain(phrase);
    }

    expect(rec?.note).toContain("ArchitectureCreatedClarificationsPanel");
    expect(rec?.note).toContain("TB-1836");
  });

  it("builds run-scoped correction hrefs for clarifications CTAs (TB-1837)", () => {
    expect(buildArchitectureCorrectionHref("run-rec", null)).toContain("rerun=run-rec");
    expect(buildArchitectureCorrectionHref("run-rec", null)).toContain("path=guided-intake");
  });

  it("counts open-question entities in clarifications badge math (TB-1838)", () => {
    expect(countOpenClarifications(countClarificationGaps([]), 2)).toBe(2);
    expect(countOpenClarifications(countClarificationGaps([]), 0)).toBe(0);
  });
});
