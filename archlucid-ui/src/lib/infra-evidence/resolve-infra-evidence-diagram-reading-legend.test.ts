import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceDiagramReadingLegend } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-reading-legend";

describe("resolveInfraEvidenceDiagramReadingLegend", () => {
  it("uses configured-not-action inventory lines for executive mode", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("executive");

    expect(lines.boxes).toBe("Boxes are resources in this inventory view.");
    expect(lines.connectors).toBe("Each connector is only as strong as its own line.");
    expect(lines.evidenceKind).toBe("This view does not prove reachability or runtime use.");
  });

  it("describes data-flow view without declaring every connector", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataFlow");

    expect(lines.boxes).toBe("Boxes are resources in this data-flow view.");
    expect(lines.connectors).toBe("Connectors follow the line label. A line is not observed traffic.");
    expect(lines.evidenceKind).toMatch(/does not prove reachability or runtime use/);
    expect(lines.boxes).not.toMatch(/declared path/);
    expect(lines.connectors).not.toMatch(/declared wiring/);
  });

  it("describes data-architecture view without calling every box a data store", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataArchitecture");

    expect(lines.boxes).toBe("Boxes are resources in the data-architecture view.");
    expect(lines.connectors).toBe(
      "Connectors are the relationships drawn for that view. They are not observed queries.",
    );
    expect(lines.boxes).not.toMatch(/data stores/);
  });

  it("uses the same reachability honesty for network mode", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("network");

    expect(lines.evidenceKind).toBe("This view does not prove reachability or runtime use.");
    expect(lines.evidenceKind).not.toMatch(/configuration from inventory/);
  });
});
