import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE } from "@/lib/bulk-evidence-upload-copy";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING,
  RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD,
} from "@/lib/runs/run-detail-create-home-evidence-copy";
import { buildRunDetailCreateHomeEvidenceDiagramHref } from "@/lib/runs/run-detail-create-home-evidence-diagram-href";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CREATE_HOME_EVIDENCE_BAND_TEST_FILES = [
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeEvidencePanel.test.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeEvidenceCaptureRegion.test.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCaptureEvidenceSection.test.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageView.create-home-evidence.test.ts",
  "src/lib/runs/run-detail-create-home-captured-evidence.test.ts",
  "src/lib/runs/run-detail-create-home-evidence-diagram-href.test.ts",
  "src/lib/bulk-evidence-upload-copy.test.ts",
] as const;

const REE_TRAFFIC_HONESTY_PHRASES = [
  "Create-home-only",
  "ignored on committed ReviewDetailWorkspace",
  "reviewTab=evidence",
  "cannot improve further toward 80",
] as const;

describe("create-home evidence band regression (TB-1850)", () => {
  it("keeps sibling Vitest guards for TB-1846 through TB-1849 on disk", () => {
    for (const relativePath of CREATE_HOME_EVIDENCE_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors REE traffic honesty for create-home-only reviewTab=evidence (TB-1846)", () => {
    const ree = findUiRouteTrafficRow("REE");

    expect(ree).toBeDefined();
    expect(ree?.path).toBe("/architecture/reviews/[reviewId]?reviewTab=evidence");
    expect(ree?.section).toBe("Tab surface");

    for (const phrase of REE_TRAFFIC_HONESTY_PHRASES) {
      expect(ree?.note, phrase).toContain(phrase);
    }

    expect(ree?.note).toContain("RunDetailCaptureEvidenceSection");
    expect(ree?.note).toContain("TB-1846");
  });

  it("keeps orientation and captured-inventory copy for pre-finalization Evidence (TB-1847)", () => {
    expect(RUN_DETAIL_CREATE_HOME_EVIDENCE_ORIENTATION_LEAD).toMatch(/before you finalize/i);
    expect(RUN_DETAIL_CREATE_HOME_CAPTURED_EVIDENCE_HEADING).toBe("Uploaded captures");
  });

  it("links create-home Evidence to Diagram archTab with create intent (TB-1848)", () => {
    const href = buildRunDetailCreateHomeEvidenceDiagramHref("run-ree");

    expect(href).toContain("/architecture/reviews/run-ree");
    expect(href).toContain("reviewTab=architecture");
    expect(href).toContain("fromGeneration=1");
  });

  it("uses shared Add evidence capture label (TB-1849)", () => {
    expect(RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE).toBe("Add evidence");
  });
});
