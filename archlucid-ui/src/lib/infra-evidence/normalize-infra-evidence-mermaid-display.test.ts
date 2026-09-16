import { describe, expect, it } from "vitest";

import {
  normalizeInfraEvidenceLayoutSvgForDisplay,
  normalizeInfraEvidenceMermaidSourceForDisplay,
} from "@/lib/infra-evidence/normalize-infra-evidence-mermaid-display";

describe("normalizeInfraEvidenceMermaidSourceForDisplay", () => {
  it("lowercases quoted node labels in mermaid source", () => {
    const source = [
      "flowchart TD",
      '    n_vnet["VNet-AEP-HI-TEST-WUS-001"]',
      '    n_pip["Gateway-PIP"] --> n_vnet',
    ].join("\n");

    expect(normalizeInfraEvidenceMermaidSourceForDisplay(source)).toBe([
      "flowchart TD",
      '    n_vnet["vnet-aep-hi-test-wus-001"]',
      '    n_pip["gateway-pip"] --> n_vnet',
    ].join("\n"));
  });

  it("lowercases resource group map labels while preserving counts", () => {
    const source = '    n1["RG-Net (40 resources)"]';

    expect(normalizeInfraEvidenceMermaidSourceForDisplay(source)).toBe('    n1["rg-net (40 resources)"]');
  });

  it("leaves mermaid comments untouched", () => {
    const source = '    %% al-type=Microsoft.Network/virtualNetworks al-rg=RG-Net';

    expect(normalizeInfraEvidenceMermaidSourceForDisplay(source)).toBe(source);
  });
});

describe("normalizeInfraEvidenceLayoutSvgForDisplay", () => {
  it("lowercases text nodes in server layout svg", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>Gateway-PIP</text></svg>';

    expect(normalizeInfraEvidenceLayoutSvgForDisplay(svg)).toContain("gateway-pip");
    expect(normalizeInfraEvidenceLayoutSvgForDisplay(svg)).not.toContain("Gateway-PIP");
  });

  it("lowercases tspans without flattening wrapped lines", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<text><tspan>Vnet-App</tspan><tspan dy="16">-Hi</tspan></text>',
      "</svg>",
    ].join("");

    const normalized = normalizeInfraEvidenceLayoutSvgForDisplay(svg);

    expect(normalized).toContain("<tspan>vnet-app</tspan>");
    expect(normalized).toContain('dy="16"');
    expect(normalized).toContain('dy="16">-hi</tspan>');
    expect(normalized.match(/<tspan[\s>]/g)?.length ?? 0).toBe(2);
  });
});
