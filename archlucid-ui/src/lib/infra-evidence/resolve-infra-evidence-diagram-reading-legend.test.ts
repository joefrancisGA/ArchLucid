import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceDiagramReadingLegend } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-reading-legend";

describe("resolveInfraEvidenceDiagramReadingLegend", () => {
  it("uses generic inventory lines for executive mode", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("executive");

    expect(lines.boxes).toMatch(/cloud resources/i);
    expect(lines.evidenceKind).toMatch(/not live cloud telemetry/i);
    expect(lines.connectors).toMatch(/relationships already on the diagram/);
    expect(lines.evidenceKind).toMatch(/configuration from inventory/);
  });

  it("keeps data-flow honesty about observed traffic", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataFlow");

    expect(lines.evidenceKind).toMatch(/not observed traffic/i);
    expect(lines.boxes).toMatch(/declared path/);
    expect(lines.connectors).toMatch(/declared wiring/);
  });

  it("describes data architecture stores and repository relationships", () => {
    const lines = resolveInfraEvidenceDiagramReadingLegend("dataArchitecture");

    expect(lines.boxes).toMatch(/data stores/);
    expect(lines.connectors).toMatch(/repository relationships/);
  });
});
