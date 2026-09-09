import { describe, expect, it } from "vitest";

import { applyStoredEvidenceMermaidShapeHighlight } from "@/lib/runs/stored-evidence-mermaid-shape-highlight";

describe("applyStoredEvidenceMermaidShapeHighlight", () => {
  it("adds highlight class to matching mermaid node groups", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "node");
    node.setAttribute("id", "flowchart-api-0");
    svg.appendChild(node);

    const highlighted = applyStoredEvidenceMermaidShapeHighlight(svg, "api");

    expect(highlighted).toBe(true);
    expect(node.classList.contains("stored-evidence-mermaid-shape-highlight")).toBe(true);
  });

  it("returns false when no node matches the shape id", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
    node.setAttribute("class", "node");
    node.setAttribute("id", "flowchart-db-0");
    svg.appendChild(node);

    const highlighted = applyStoredEvidenceMermaidShapeHighlight(svg, "api");

    expect(highlighted).toBe(false);
    expect(node.classList.contains("stored-evidence-mermaid-shape-highlight")).toBe(false);
  });
});
