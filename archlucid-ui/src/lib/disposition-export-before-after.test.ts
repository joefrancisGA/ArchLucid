import { describe, expect, it } from "vitest";

import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";
import {
  DISPOSITION_EXPORT_BEFORE_OPEN_ROI_BUCKET,
  buildDispositionExportBeforeAfter,
  findingDispositionKindLabel,
} from "@/lib/disposition-export-before-after";
import {
  DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING,
  dispositionExportSponsorRoiBucketLabel,
} from "@/lib/disposition-export-impact";

const ALL_KINDS = [
  "Accepted",
  "RejectedAsNotApplicable",
  "Deferred",
  "NeedsEvidence",
  "Remediated",
] as const satisfies readonly FindingDispositionKind[];

describe("disposition-export-before-after (TB-2193)", () => {
  it("builds Open before-state and disposition after-state for Accepted", () => {
    const preview = buildDispositionExportBeforeAfter({
      disposition: "Accepted",
      findingTitle: "PHI minimization",
    });

    expect(preview.dispositionLabel).toBe("Accepted");
    expect(preview.beforeLines.some((line) => line.includes(DISPOSITION_EXPORT_BEFORE_OPEN_ROI_BUCKET))).toBe(
      true,
    );
    expect(preview.beforeLines.some((line) => line.includes("Open (awaiting disposition)"))).toBe(true);
    expect(preview.afterLines.some((line) => line.includes("Accepted risk"))).toBe(true);
    expect(preview.afterLines.some((line) => line.includes("Finding: PHI minimization — Accepted"))).toBe(
      true,
    );
    expect(
      preview.beforeLines.some((line) => line.includes(`## ${DISPOSITION_EXPORT_IMPACT_SPONSOR_ROI_SECTION_HEADING}`)),
    ).toBe(true);
    expect(preview.afterLines.some((line) => line.includes("appends disposition event (Accepted)"))).toBe(
      true,
    );
  });

  it("uses currentDisposition for before ROI bucket when provided", () => {
    const preview = buildDispositionExportBeforeAfter({
      disposition: "Remediated",
      currentDisposition: "Deferred",
      findingTitle: "Latency budget",
    });

    expect(preview.beforeLines.some((line) => line.includes("Deferred"))).toBe(true);
    expect(preview.afterLines.some((line) => line.includes("Realized (remediated)"))).toBe(true);
    expect(preview.dispositionLabel).toBe("Remediated");
  });

  it("maps every disposition kind to a label and after ROI bucket", () => {
    for (const disposition of ALL_KINDS) {
      const preview = buildDispositionExportBeforeAfter({ disposition });
      const bucket = dispositionExportSponsorRoiBucketLabel(disposition);

      expect(preview.dispositionLabel).toBe(findingDispositionKindLabel(disposition));
      expect(preview.afterLines.some((line) => line.includes(bucket))).toBe(true);
      expect(preview.beforeLines).toHaveLength(preview.afterLines.length);
    }
  });
});
