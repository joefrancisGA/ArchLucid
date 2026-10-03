export type DiagramNeighborhoodType = {
  readonly name: string;
  readonly count: number;
};

export type DiagramNeighborhood = {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly resourceCount: number;
  readonly memberIds: readonly string[];
  readonly frameIds: readonly string[];
  readonly types: readonly DiagramNeighborhoodType[];
};

export type DiagramNeighborhoodLink = {
  readonly from: string;
  readonly to: string;
  readonly count: number;
};

export type DiagramNeighborhoodMap = {
  readonly neighborhoods: readonly DiagramNeighborhood[];
  readonly links: readonly DiagramNeighborhoodLink[];
};

export const DIAGRAM_NEIGHBORHOOD_MAP_MIN_COUNT = 4;
export const DIAGRAM_NEIGHBORHOOD_MAP_MIN_RESOURCE_COUNT = 40;

function readNonNegativeInteger(element: Element, attribute: string): number {
  const value = Number.parseInt(element.getAttribute(attribute) ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function parseDiagramNeighborhoodMap(markup: string): DiagramNeighborhoodMap | null {
  if (typeof DOMParser === "undefined") {
    return null;
  }

  const document = new DOMParser().parseFromString(markup, "image/svg+xml");
  const metadata = document.querySelector("metadata#diagram-neighborhoods");
  if (metadata === null) {
    return null;
  }

  const neighborhoods = [...metadata.querySelectorAll(":scope > neighborhood")]
    .map((element): DiagramNeighborhood => ({
      id: element.getAttribute("id") ?? "",
      kind: element.getAttribute("kind") ?? "",
      title: element.getAttribute("title") ?? "",
      resourceCount: readNonNegativeInteger(element, "resource-count"),
      memberIds: [...element.querySelectorAll(":scope > member")]
        .map((member) => member.getAttribute("id") ?? "")
        .filter(Boolean),
      frameIds: [...element.querySelectorAll(":scope > frame")]
        .map((frame) => frame.getAttribute("id") ?? "")
        .filter(Boolean),
      types: [...element.querySelectorAll(":scope > type")]
        .map((type) => ({
          name: type.getAttribute("name") ?? "",
          count: readNonNegativeInteger(type, "count"),
        }))
        .filter((type) => type.name.length > 0),
    }))
    .filter((neighborhood) => neighborhood.id.length > 0);

  const links = [...metadata.querySelectorAll(":scope > link")]
    .map((element): DiagramNeighborhoodLink => ({
      from: element.getAttribute("from") ?? "",
      to: element.getAttribute("to") ?? "",
      count: readNonNegativeInteger(element, "count"),
    }))
    .filter((link) => link.from.length > 0 && link.to.length > 0);

  return { neighborhoods, links };
}

export function shouldAutoOpenDiagramNeighborhoodMap(map: DiagramNeighborhoodMap): boolean {
  return map.neighborhoods.length >= DIAGRAM_NEIGHBORHOOD_MAP_MIN_COUNT
    || map.neighborhoods.reduce((sum, neighborhood) => sum + neighborhood.resourceCount, 0)
      >= DIAGRAM_NEIGHBORHOOD_MAP_MIN_RESOURCE_COUNT;
}
