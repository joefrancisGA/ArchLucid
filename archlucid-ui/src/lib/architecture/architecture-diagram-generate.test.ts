import { describe, expect, it } from "vitest";

import { generateArchitectureDiagram } from "@/lib/architecture/architecture-diagram-generate";
import { architectureDiagramModelToMermaid } from "@/lib/architecture/architecture-diagram-mermaid";
import { buildArchitectureDiagramModel } from "@/lib/architecture/architecture-diagram-model";
import { parseArchitectureGeneratedContent } from "@/lib/architecture/architecture-generated-content-parser";

const assertions = {
  architectureName: "Retail API",
  architectureOverview: "Customer-facing retail API.",
  businessOutcome: "Launch resilient checkout.",
  peopleAndSystems: [
    { label: "Store associate", kind: "Human" },
    { label: "Payment gateway", kind: "Machine" },
  ],
};

describe("generateArchitectureDiagram", () => {
  it("generates mermaid for sufficient structured architecture content", () => {
    const source = `## Systems and services
- Retail API
## Users and stakeholders
- Store associate
## Data flows
Store associate -> Retail API`;

    const result = generateArchitectureDiagram(source, "Retail API", assertions);

    expect(result.readiness.sufficient).toBe(true);
    expect(result.mermaidSource).toContain("flowchart TB");
    expect(result.mermaidSource).toContain("Store associate");
    expect(result.textAlternative).toContain("Store associate");
  });

  it("returns insufficient state without fabricating components", () => {
    const result = generateArchitectureDiagram("Short brief only.", "Untitled architecture", {
      ...assertions,
      peopleAndSystems: [],
      architectureName: "",
    });

    expect(result.readiness.sufficient).toBe(false);
    expect(result.mermaidSource).toBeNull();
    expect(result.model).toBeNull();
  });

  it("labels inferred nodes in mermaid output", () => {
    const parseResult = parseArchitectureGeneratedContent(
      `## Systems and services
- Inferred billing adapter`,
      assertions,
    );
    const model = buildArchitectureDiagramModel(parseResult, "Retail API");
    const mermaid = architectureDiagramModelToMermaid(model);

    expect(mermaid).toContain("inferred");
    expect(mermaid).toContain("inferredNode");
  });

  it("creates each leg of a chained data-flow narrative", () => {
    const source = `## Systems and services
- Payment API
- Queue
- Worker
## Users and stakeholders
- Customer
## Data flows
Payment API -> Queue -> Worker`;

    const result = generateArchitectureDiagram(source, "Payment API", assertions);

    expect(result.model?.edges).toHaveLength(2);
    expect(result.model?.edges.map((edge) => [edge.sourceId, edge.targetId])).toEqual([
      ["system_payment_api", "system_queue"],
      ["system_queue", "system_worker"],
    ]);
  });
});
