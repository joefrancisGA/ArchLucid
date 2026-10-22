import { describe, expect, it } from "vitest";

import { buildFindingDiagramSpotlight } from "@/lib/architecture/build-finding-diagram-spotlight";

describe("buildFindingDiagramSpotlight", () => {
  it("uses node-id copy when related ids match", () => {
    const text = buildFindingDiagramSpotlight(
      {
        findingId: "f-1",
        matchedNodeId: "node-a",
        matchedNodeLabel: "Claims API",
        matchKind: "node-id",
      },
      {
        findingId: "f-1",
        title: "Public endpoint exposure",
      },
    );

    expect(text).toContain("Claims API");
    expect(text).toContain("Public endpoint exposure");
    expect(text).not.toContain("package citation");
  });

  it("uses heuristic copy without claiming package citation", () => {
    const text = buildFindingDiagramSpotlight(
      {
        findingId: "f-2",
        matchedNodeId: "node-b",
        matchedNodeLabel: "SQL DB",
        matchKind: "label-heuristic",
      },
      {
        findingId: "f-2",
        title: "Missing private link",
      },
    );

    expect(text).toContain("not a package citation");
    expect(text).not.toContain("This finding cites");
  });
});
