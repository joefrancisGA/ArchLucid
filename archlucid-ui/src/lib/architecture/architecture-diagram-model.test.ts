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
