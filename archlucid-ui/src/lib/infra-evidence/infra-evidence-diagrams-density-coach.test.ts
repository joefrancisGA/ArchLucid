import { describe, expect, it } from "vitest";

import { shouldShowInfraDiagramsDensityCoach } from "@/lib/infra-evidence/infra-evidence-diagrams-density-coach";

const readableFullSubscriptionPartition = {
  showFallbackCards: true,
  tooLargeForBrowser: false,
  diagramContentEmpty: false,
  renderStatus: "Succeeded",
  paintDiagramCanvas: true,
  selectedMode: "full",
  nodeCount: 11,
  maxNodes: 400,
  isExecutiveMode: false,
} as const;

describe("shouldShowInfraDiagramsDensityCoach", () => {
  it("hides the coach when a small partition already paints", () => {
    expect(shouldShowInfraDiagramsDensityCoach(readableFullSubscriptionPartition)).toBe(false);
  });

  it("shows the coach when full subscription is partitioned and nothing paints", () => {
    expect(
      shouldShowInfraDiagramsDensityCoach({
        ...readableFullSubscriptionPartition,
        renderStatus: "Failed",
        paintDiagramCanvas: false,
        nodeCount: 11,
      }),
    ).toBe(true);
  });

  it("hides the coach in executive mode when the plate paints", () => {
    expect(
      shouldShowInfraDiagramsDensityCoach({
        ...readableFullSubscriptionPartition,
        selectedMode: "executive",
        isExecutiveMode: true,
        showFallbackCards: false,
      }),
    ).toBe(false);
  });

  it("shows the coach in executive mode when render failed and nothing paints", () => {
    expect(
      shouldShowInfraDiagramsDensityCoach({
        ...readableFullSubscriptionPartition,
        selectedMode: "executive",
        isExecutiveMode: true,
        showFallbackCards: false,
        renderStatus: "Failed",
        paintDiagramCanvas: false,
      }),
    ).toBe(true);
  });
});
