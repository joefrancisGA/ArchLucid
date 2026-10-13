import { describe, expect, it } from "vitest";

import { buildInfraEvidencePngReadingStripLines } from "@/lib/infra-evidence/infra-evidence-png-reading-strip";

describe("infra-evidence-png-reading-strip", () => {
  it("includes the data-flow job and applicable stroke rows", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "dataFlow",
      outline: {
        nodes: [],
        edges: [
          {
            from: "app",
            to: "sql",
            label: "May access",
            source: "probable",
            confidenceBand: "probable",
            provenanceKind: "DerivedFact",
            inferenceSource: "inventory-app-authorized-access",
            declaredConnectionId: null,
          },
        ],
      },
      completenessWarnings: [],
    });

    expect(lines).toContain("This diagram shows what may connect. It is not observed traffic.");
    expect(lines).toContain("Dashed — probable authorization or declared wiring (RBAC / ADF; not runtime traffic)");
  });

  it("omits the data-flow job from network exports", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "network",
      outline: null,
      completenessWarnings: [],
    });

    expect(lines).not.toContain("This diagram shows what may connect. It is not observed traffic.");
  });

  it("includes a warning count and bounded human-readable warning titles", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "executive",
      outline: null,
      completenessWarnings: [
        "app-settings-not-collected-hosted-get-only",
        "rbac-scope-too-broad:/subscriptions/sub",
      ],
    });

    expect(lines).toContain("Inventory completeness warnings (2). Connection lines may be missing.");
    expect(lines).toContain("Warning: App setting hostnames not collected on hosted pull");
    expect(lines.join("\n")).not.toContain("/subscriptions/sub");
  });

  it("does not claim that a data-flow line was observed traffic", () => {
    const lines = buildInfraEvidencePngReadingStripLines({
      mode: "dataFlow",
      outline: null,
      completenessWarnings: [],
    });

    expect(lines.join("\n")).not.toContain("Observed traffic occurred");
  });
});
