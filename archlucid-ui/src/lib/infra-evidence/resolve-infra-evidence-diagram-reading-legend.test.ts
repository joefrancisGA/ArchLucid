import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceDiagramReadingLegend } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-reading-legend";

describe("resolveInfraEvidenceDiagramReadingLegend", () => {
  it("uses configured-not-action inventory lines for executive mode", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("executive");

    expect(lines.boxes).toBe("Azure resources");
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
