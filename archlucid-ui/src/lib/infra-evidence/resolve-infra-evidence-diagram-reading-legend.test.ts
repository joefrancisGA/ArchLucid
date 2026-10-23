import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceDiagramReadingLegend } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-reading-legend";

describe("resolveInfraEvidenceDiagramReadingLegend", () => {
  it("uses generic inventory lines for executive mode", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("executive");

    expect(lines.boxes).toMatch(/Azure resources/);
    expect(lines.connectors).toMatch(/relationships already on the diagram/);
    expect(lines.evidenceKind).toMatch(/configuration from inventory/);
  });

  it("keeps data-flow honesty about observed traffic", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataFlow");

    expect(lines.evidenceKind).toMatch(/not observed traffic/i);
    expect(lines.boxes).toMatch(/what may connect/);
    expect(lines.connectors).toMatch(/not observed traffic/);
    expect(lines.boxes).not.toMatch(/declared path/);
  });

  it("uses data-architecture inventory caption", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataArchitecture");

    expect(lines.boxes).toMatch(/Inventory of data platforms/);
    expect(lines.connectors).toMatch(/not a data-flow diagram/);
  });

  it("uses network placement reachability note", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("network");

    expect(lines.boxes).toMatch(/does not prove reachability/);
    expect(lines.connectors).toMatch(/does not prove reachability/);
  });
});
