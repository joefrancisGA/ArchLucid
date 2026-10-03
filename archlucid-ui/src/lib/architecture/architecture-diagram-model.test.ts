import { describe, expect, it } from "vitest";

import { buildArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-model";

describe("buildArchitectureDiagramModel", () => {
  it("preserves data-flow endpoints whose labels contain the word 'to'", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [
              { label: "Token", detail: null, provenance: "asserted" },
              { label: "API", detail: null, provenance: "asserted" },
            ],
            provenance: "asserted",
          },
          {
            key: "data-flows",
            title: "Data flows",
            narrativeMarkdown: null,
            entities: [
              { label: "Token", detail: "API", provenance: "asserted" },
            ],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Token: API",
      },
      "Payments",
    );

    expect(model.edges).toEqual([
      expect.objectContaining({
        sourceId: "system_token",
        targetId: "system_api",
      }),
    ]);
  });
});
