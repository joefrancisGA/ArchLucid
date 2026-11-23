import { normalizeDiagramFocusToken } from "@/lib/architecture/architecture-diagram-click-focus";

export type DiagramConnectorVisibilitySelection = {
  readonly from: string;
  readonly to: string;
  readonly label: string | null;
};

function readEdgeEndpointTokens(edge: Element, attribute: "from" | "to"): readonly string[] {
  const bundleKey = attribute === "from" ? "data-bundle-from" : "data-bundle-to";
  const singleKey = attribute === "from" ? "data-from" : "data-to";
  const raw = edge.getAttribute(bundleKey) ?? edge.getAttribute(singleKey) ?? "";

  return raw
    .split(/\s+/u)
    .filter(Boolean)
    .map((token) => normalizeDiagramFocusToken(token));
}

function edgeMatchesConnectorVisibility(
  edge: Element,
  connector: DiagramConnectorVisibilitySelection,
): boolean {
  const fromTokens = readEdgeEndpointTokens(edge, "from");
  const toTokens = readEdgeEndpointTokens(edge, "to");
  const label = edge.querySelector("title")?.textContent?.trim() ?? "";
  const normalizedLabel = label.toLowerCase();
  const normalizedConnectorLabel = connector.label?.trim().toLowerCase() ?? "";
  const selectedFrom = normalizeDiagramFocusToken(connector.from);
  const selectedTo = normalizeDiagramFocusToken(connector.to);

  if (selectedFrom.length === 0 || selectedTo.length === 0) {
    return false;
  }

  const sameEndpoints = fromTokens.includes(selectedFrom) && toTokens.includes(selectedTo);
  const sameLabel = normalizedConnectorLabel.length === 0 || normalizedLabel === normalizedConnectorLabel;

  return sameEndpoints && sameLabel;
}

export function applyConnectorVisibility(
  svg: SVGSVGElement,
  visibleConnectors: readonly DiagramConnectorVisibilitySelection[] | null | undefined,
): void {
  [...svg.querySelectorAll<SVGGElement>("g.edge")].forEach((edge) => {
    edge.classList.remove("diagram-family-hidden");
    edge.style.removeProperty("display");
  });

  if (visibleConnectors == null) {
    return;
  }

  [...svg.querySelectorAll<SVGGElement>("g.edge")].forEach((edge) => {
    const isVisible = visibleConnectors.some((connector) => edgeMatchesConnectorVisibility(edge, connector));

    if (!isVisible) {
      edge.classList.add("diagram-family-hidden");
      edge.style.display = "none";
    }
  });
}