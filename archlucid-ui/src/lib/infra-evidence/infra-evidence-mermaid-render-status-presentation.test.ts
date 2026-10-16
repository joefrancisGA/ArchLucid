import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceMermaidRenderStatusPresentation } from "@/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation";

describe("resolveInfraEvidenceMermaidRenderStatusPresentation", () => {
  it("labels blank render status as not stored", () => {
    expect(
      resolveInfraEvidenceMermaidRenderStatusPresentation({ status: " ", mermaidEmpty: false }).label,
    ).toBe("Render status was not stored.");
  });

  it("keeps known render statuses unchanged", () => {
    expect(
      resolveInfraEvidenceMermaidRenderStatusPresentation({ status: "Succeeded", mermaidEmpty: false }).label,
    ).toBe("Render succeeded");
    expect(
      resolveInfraEvidenceMermaidRenderStatusPresentation({ status: "Partitioned", mermaidEmpty: false }).label,
    ).toBe("Partitioned render");
    expect(
      resolveInfraEvidenceMermaidRenderStatusPresentation({ status: "Failed", mermaidEmpty: false }).label,
    ).toBe("Render failed");
  });
});
