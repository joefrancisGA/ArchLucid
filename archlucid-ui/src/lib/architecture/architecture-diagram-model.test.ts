import { describe, expect, it } from "vitest";

import { buildArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-model";

describe("buildArchitectureDiagramModel", () => {
  it("distinguishes omitted entity lists from stored-empty lists in honesty lines (P-07)", () => {
    const omitted = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Claims API",
      },
      "Payments",
    );

    expect(omitted.entitySectionHonestyLines).toContain("Systems and services: Entities were not stored.");

    const storedEmpty = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Claims API",
      },
      "Payments",
    );

    expect(storedEmpty.entitySectionHonestyLines).toContain("Systems and services: Entities were stored empty.");
  });

  it("counts entities skipped because diagram labels were not stored", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [
              { label: "Claims API", detail: null, provenance: "asserted" },
              { label: "   ", detail: null, provenance: "asserted" },
            ],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Claims API",
      },
      "Payments",
    );

    expect(model.nodes.filter((node) => node.label === "Claims API")).toHaveLength(1);
    expect(model.skippedUnlabeledEntityCount).toBe(1);
  });

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

  it("preserves endpoint labels that contain the word 'to' before an arrow", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [
              { label: "Order to Cash", detail: null, provenance: "asserted" },
              { label: "Billing", detail: null, provenance: "asserted" },
            ],
            provenance: "asserted",
          },
          {
            key: "data-flows",
            title: "Data flows",
            narrativeMarkdown: null,
            entities: [
              { label: "Order to Cash -> Billing", detail: null, provenance: "asserted" },
            ],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Order to Cash -> Billing",
      },
      "Payments",
    );

    expect(model.edges).toEqual([
      expect.objectContaining({
        sourceId: "system_order_to_cash",
        targetId: "system_billing",
      }),
    ]);
  });

  it("resolves duplicate labels to the endpoint in the same node kind as the source", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "users-and-stakeholders",
            title: "Users",
            narrativeMarkdown: null,
            entities: [{ label: "API", detail: null, provenance: "asserted" }],
            provenance: "asserted",
          },
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [
              { label: "Gateway", detail: null, provenance: "asserted" },
              { label: "API", detail: null, provenance: "asserted" },
            ],
            provenance: "asserted",
          },
          {
            key: "data-flows",
            title: "Data flows",
            narrativeMarkdown: null,
            entities: [{ label: "Gateway -> API", detail: null, provenance: "asserted" }],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Gateway -> API",
      },
      "Payments",
    );

    expect(model.edges).toEqual([
      expect.objectContaining({
        sourceId: "system_gateway",
        targetId: "system_api",
      }),
    ]);
  });

  it("does not draw flows when endpoint labels are ambiguous across node kinds (P-05)", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "users-and-stakeholders",
            title: "Users",
            narrativeMarkdown: null,
            entities: [{ label: "Portal", detail: null, provenance: "asserted" }],
            provenance: "asserted",
          },
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [
              { label: "Portal", detail: null, provenance: "asserted" },
              { label: "API", detail: null, provenance: "asserted" },
            ],
            provenance: "asserted",
          },
          {
            key: "data-flows",
            title: "Data flows",
            narrativeMarkdown: null,
            entities: [{ label: "Portal -> API", detail: null, provenance: "asserted" }],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Portal -> API",
      },
      "Payments",
    );

    expect(model.edges).toEqual([]);
  });

  it("adds the architecture name as an inferred system node when it is not already listed (P-01)", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [{ label: "Billing API", detail: null, provenance: "asserted" }],
            provenance: "asserted",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "- Billing API",
      },
      "Payments edge review",
    );

    const nameNode = model.nodes.find((node) => node.label === "Payments edge review");

    expect(nameNode?.provenance).toBe("inferred");
    expect(nameNode?.accepted).toBe(false);
  });

  it("materializes pipe-delimited data flows when detail includes a description column", () => {
    const model = buildArchitectureDiagramModel(
      {
        sections: [
          {
            key: "systems-and-services",
            title: "Systems and services",
            narrativeMarkdown: null,
            entities: [
              { label: "Gateway", detail: null, provenance: "inferred" },
              { label: "API", detail: null, provenance: "inferred" },
            ],
            provenance: "inferred",
          },
          {
            key: "data-flows",
            title: "Data flows",
            narrativeMarkdown: null,
            entities: [
              {
                label: "Gateway",
                detail: "API · TLS 1.2",
                provenance: "inferred",
              },
            ],
            provenance: "inferred",
          },
        ],
        hasPartialParseFailure: false,
        suppressedArtifactCount: 0,
        sourceText: "Gateway|API|TLS 1.2",
      },
      "Payments",
    );

    expect(model.edges).toEqual([
      expect.objectContaining({
        sourceId: "system_gateway",
        targetId: "system_api",
        label: "TLS 1.2",
      }),
    ]);
  });
});
