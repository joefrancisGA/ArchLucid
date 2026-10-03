import { describe, expect, it } from "vitest";

import {
  DIAGRAM_NEIGHBORHOOD_MAP_MIN_COUNT,
  parseDiagramNeighborhoodMap,
  shouldAutoOpenDiagramNeighborhoodMap,
  type DiagramNeighborhoodMap,
} from "@/lib/architecture/architecture-diagram-neighborhood-map";

const fixture = `
  <svg xmlns="http://www.w3.org/2000/svg">
    <metadata id="diagram-neighborhoods">
      <neighborhood id="vnet:app" kind="vnet" title="app-vnet" resource-count="4">
        <member id="vm-a"/>
        <frame id="vnet-app"/>
        <type name="virtualMachines" count="2"/>
      </neighborhood>
      <neighborhood id="shared:rg-sec" kind="shared" title="rg-sec" resource-count="1"/>
      <link from="shared:rg-sec" to="vnet:app" count="1"/>
    </metadata>
  </svg>
`;

describe("parseDiagramNeighborhoodMap", () => {
  it("returns null when the SVG has no neighborhood metadata", () => {
    expect(parseDiagramNeighborhoodMap("<svg />")).toBeNull();
  });

  it("parses neighborhoods, members, frames, types, and links", () => {
    expect(parseDiagramNeighborhoodMap(fixture)).toEqual({
      neighborhoods: [
        {
          id: "vnet:app",
          kind: "vnet",
          title: "app-vnet",
          resourceCount: 4,
          memberIds: ["vm-a"],
          frameIds: ["vnet-app"],
          types: [{ name: "virtualMachines", count: 2 }],
        },
        {
          id: "shared:rg-sec",
          kind: "shared",
          title: "rg-sec",
          resourceCount: 1,
          memberIds: [],
          frameIds: [],
          types: [],
        },
      ],
      links: [{ from: "shared:rg-sec", to: "vnet:app", count: 1 }],
    });
  });
});

describe("shouldAutoOpenDiagramNeighborhoodMap", () => {
  it("opens for four neighborhoods or forty resources", () => {
    const three: DiagramNeighborhoodMap = {
      neighborhoods: [
        { id: "a", kind: "vnet", title: "a", resourceCount: 4, memberIds: [], frameIds: [], types: [] },
        { id: "b", kind: "vnet", title: "b", resourceCount: 3, memberIds: [], frameIds: [], types: [] },
        { id: "c", kind: "vnet", title: "c", resourceCount: 3, memberIds: [], frameIds: [], types: [] },
      ],
      links: [],
    };

    expect(three.neighborhoods).toHaveLength(DIAGRAM_NEIGHBORHOOD_MAP_MIN_COUNT - 1);
    expect(shouldAutoOpenDiagramNeighborhoodMap(three)).toBe(false);
    expect(shouldAutoOpenDiagramNeighborhoodMap({
      neighborhoods: [...three.neighborhoods, { ...three.neighborhoods[0], id: "d" }],
      links: [],
    })).toBe(true);
    expect(shouldAutoOpenDiagramNeighborhoodMap({
      neighborhoods: [{ ...three.neighborhoods[0], resourceCount: 40 }],
      links: [],
    })).toBe(true);
  });
});
