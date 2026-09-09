import { describe, expect, it } from "vitest";

import {
  PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE,
  formatPixelDiagramNotVerifiableLabel,
  parsePixelDiagramNotVerifiableWarning,
  readPixelDiagramNotVerifiableSourcesFromContextSnapshot,
} from "@/lib/architecture-spine/read-pixel-diagram-not-verifiable-sources";
import { PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX } from "@/lib/architecture-spine/pixel-diagram-not-verifiable-warnings";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";
import { formatCareerExportMeasurementFloorMarkdown } from "@/lib/career-export-coverage-honesty";

describe("pixel diagram not verifiable sources (AS-005)", () => {
  it("parses machine-readable warnings from context snapshot", () => {
    const sources = readPixelDiagramNotVerifiableSourcesFromContextSnapshot({
      warnings: [
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}file=topology.png;mime=image/png;evidenceItemId=none;pending=pending-stored-file:topology.png`,
      ],
    });

    expect(sources).toEqual([
      {
        fileName: "topology.png",
        sourceMimeType: "image/png",
        evidenceItemId: null,
        pendingStoredFileMarker: "pending-stored-file:topology.png",
      },
    ]);
  });

  it("uses TB-645 operator copy and does not claim screenshot analysis", () => {
    const label = formatPixelDiagramNotVerifiableLabel({
      fileName: "diagram.jpeg",
      sourceMimeType: "image/jpeg",
      evidenceItemId: "ev-1",
      pendingStoredFileMarker: null,
    });

    expect(label).toContain(PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE);
    expect(label.toLowerCase()).not.toContain("analyzed your screenshot");
    expect(label.toLowerCase()).not.toContain("we analyze");
  });

  it("returns null for unrelated warnings", () => {
    expect(parsePixelDiagramNotVerifiableWarning("No parser for foo.bin")).toBeNull();
  });

  it("surfaces pixel diagram labels on measurement floor presentation", () => {
    const sources = readPixelDiagramNotVerifiableSourcesFromContextSnapshot({
      warnings: [
        `${PIXEL_DIAGRAM_NOT_VERIFIABLE_WARNING_PREFIX}file=topology.png;mime=image/png;evidenceItemId=none;pending=none`,
      ],
    });

    const presentation = formatInsightDensityMeasurementFloorPresentation(12, {
      pixelDiagramNotVerifiableSources: sources,
    });

    expect(presentation.pixelDiagramNotVerifiableLabels).toHaveLength(1);
    expect(presentation.pixelDiagramNotVerifiableLabels[0]).toContain(
      PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE,
    );
  });

  it("includes pixel diagram gaps in career export measurement floor markdown", () => {
    const markdown = formatCareerExportMeasurementFloorMarkdown(12, {
      pixelDiagramNotVerifiableSources: [
        {
          fileName: "topology.png",
          sourceMimeType: "image/png",
          evidenceItemId: null,
          pendingStoredFileMarker: null,
        },
      ],
    });

    expect(markdown).toContain("## Measurement floor");
    expect(markdown).toContain(PIXEL_DIAGRAM_NOT_VERIFIABLE_OPERATOR_LINE);
  });
});
