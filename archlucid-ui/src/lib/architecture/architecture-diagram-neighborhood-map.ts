export type DiagramNeighborhoodType = {
  readonly name: string;
  readonly count: number | null;
};

export type DiagramNeighborhood = {
  readonly id: string;
  readonly kind: string;
  readonly title: string;
  readonly resourceCount: number | null;
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

// Resource-group cells from DiagramForestLayoutSvgRenderer: multi-vnet, leftover, and rollup.
const RESOURCE_GROUP_NEIGHBORHOOD_KINDS = new Set(["shared", "remainder", "other"]);

const NEIGHBORHOOD_SECTION_RANK: Readonly<Record<string, number>> = {
  "virtual-networks": 0,
  "resource-groups": 1,
  "shared-services": 2,
};

export type DiagramNeighborhoodSection = {
  readonly id: string;
  readonly heading: string;
  readonly neighborhoods: readonly DiagramNeighborhood[];
};

function identityForNeighborhoodKind(kind: string): { readonly id: string; readonly heading: string } {
  if (kind === "vnet") {
    return { id: "virtual-networks", heading: "Virtual networks" };
  }

  if (RESOURCE_GROUP_NEIGHBORHOOD_KINDS.has(kind)) {
    return { id: "resource-groups", heading: "Resource groups" };
  }

  // Shared services is a separate frame, not a resource group cell.
  if (kind === "shared-services") {
    return { id: "shared-services", heading: "Shared services" };
  }

  const trimmed = kind.trim();

  if (trimmed.length === 0) {
    return { id: "unspecified", heading: "Other" };
  }

  return { id: trimmed, heading: trimmed };
}

function neighborhoodSectionRank(id: string): number {
  return NEIGHBORHOOD_SECTION_RANK[id] ?? Object.keys(NEIGHBORHOOD_SECTION_RANK).length;
}

export function groupDiagramNeighborhoodSections(
  neighborhoods: readonly DiagramNeighborhood[],
): readonly DiagramNeighborhoodSection[] {
  const groups = new Map<string, { id: string; heading: string; neighborhoods: DiagramNeighborhood[] }>();

  for (const neighborhood of neighborhoods) {
    const identity = identityForNeighborhoodKind(neighborhood.kind);
    const existing = groups.get(identity.id);

    if (existing === undefined) {
      groups.set(identity.id, {
        id: identity.id,
        heading: identity.heading,
        neighborhoods: [neighborhood],
      });

      continue;
    }

    existing.neighborhoods.push(neighborhood);
  }

  return [...groups.values()].sort(
    (left, right) => neighborhoodSectionRank(left.id) - neighborhoodSectionRank(right.id),
  );
}

function readNonNegativeInteger(element: Element, attribute: string): number | null {
  const rawValue = element.getAttribute(attribute);

  if (rawValue == null) {
    return null;
  }

  const value = Number.parseInt(rawValue, 10);

  return Number.isFinite(value) && value >= 0 ? value : null;
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
      count: readNonNegativeInteger(element, "count") ?? 0,
    }))
    .filter((link) => link.from.length > 0 && link.to.length > 0);

  return { neighborhoods, links };
}

export function shouldAutoOpenDiagramNeighborhoodMap(map: DiagramNeighborhoodMap): boolean {
  return map.neighborhoods.length >= DIAGRAM_NEIGHBORHOOD_MAP_MIN_COUNT
    || map.neighborhoods.reduce((sum, neighborhood) => sum + (neighborhood.resourceCount ?? 0), 0)
      >= DIAGRAM_NEIGHBORHOOD_MAP_MIN_RESOURCE_COUNT;
}
