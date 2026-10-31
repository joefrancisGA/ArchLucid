import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceDiagramReadingLegend } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-reading-legend";

describe("resolveInfraEvidenceDiagramReadingLegend", () => {
  it("uses configured-not-action inventory lines for executive mode", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("executive");

    expect(lines.boxes).toMatch(/ARM resource id order/i);
    expect(lines.connectors).toMatch(/Cross-group applies/);
    expect(lines.evidenceKind).toBe("This view does not prove reachability or runtime use.");
  });

  it("calls out executive overflow stripping and cross-group captions when requested (P-06/P-07)", () => {
    const stripped = resolveInfraEvidenceDiagramReadingLegend("executive", {
      executiveOverflowStripped: true,
      crossGroupFanOutIncluded: true,
    });

    expect(stripped.boxes).toMatch(/executive overflow rollups/);
    expect(stripped.connectors).toBe("Each connector is only as strong as its own line.");
  });

  it("describes data-flow view without declaring every connector", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataFlow");

    expect(lines.evidenceKind).toMatch(/not observed traffic/i);
    expect(lines.boxes).toMatch(/what may connect/);
    expect(lines.connectors).toMatch(/not observed traffic/);
    expect(lines.boxes).not.toMatch(/declared path/);
  });

  it("separates observed-in-logs from declared connectors when both appear (P-11)", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataFlow", {
      dataFlowHasObservedInLogs: true,
    });

    expect(lines.boxes).toMatch(/observed/i);
    expect(lines.connectors).toMatch(/Observed-in-logs/i);
    expect(lines.evidenceKind).toMatch(/observed-in-logs/i);
  });

  it("surfaces first-twelve drawn caption on executive legend when requested (P-13)", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("executive", {
      executiveFirstTwelveDrawn: true,
    });

    expect(lines.scopeNote).toMatch(/first 12 resources drawn on this diagram/i);
  });

  it("uses data-architecture inventory caption", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataArchitecture");

    expect(lines.boxes).toMatch(/Inventory of data platforms/);
    expect(lines.connectors).toMatch(/not a data-flow diagram/i);
  });

  it("uses network placement reachability note", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("network");

    expect(lines.boxes).toMatch(/does not prove reachability/);
    expect(lines.connectors).toMatch(/does not prove reachability/);
  });
});
