import { describe, expect, it } from "vitest";

import { applyConnectorVisibility } from "@/lib/architecture/architecture-diagram-connector-visibility";

const SVG_NS = "http://www.w3.org/2000/svg";

describe("applyConnectorVisibility", () => {
  it("keeps bundled edges visible when the family filter lists an endpoint pair", () => {
    const svg = document.createElementNS(SVG_NS, "svg");
    const edge = document.createElementNS(SVG_NS, "g");
    edge.setAttribute("class", "edge");
    edge.setAttribute("data-bundle-from", "vault vm");
    edge.setAttribute("data-bundle-to", "vnet-a");
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = "private endpoint";
    edge.appendChild(title);
    svg.appendChild(edge);

    applyConnectorVisibility(svg, [
      { from: "vault", to: "vnet-a", label: "private endpoint" },
    ]);

    expect(edge.classList.contains("diagram-family-hidden")).toBe(false);
    expect(edge.style.display).not.toBe("none");
  });
});