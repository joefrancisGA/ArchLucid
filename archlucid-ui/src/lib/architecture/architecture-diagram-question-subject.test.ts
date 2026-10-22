import { describe, expect, it } from "vitest";

import { applySecureNowQuestionSubjectHighlight } from "@/lib/architecture/architecture-diagram-question-subject";

function parseSvg(markup: string): SVGSVGElement {
  const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
  const svg = parsed.documentElement;

  if (!(svg instanceof SVGSVGElement)) {
    throw new Error("Expected SVG root.");
  }

  return svg;
}

describe("applySecureNowQuestionSubjectHighlight", () => {
  it("marks only the subject node", () => {
    const svg = parseSvg(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <g class="node" id="flowchart-seed-0">
          <title>seed</title>
          <rect x="0" y="0" width="10" height="10" />
        </g>
        <g class="node" id="flowchart-neighbor-1">
          <title>neighbor</title>
          <rect x="20" y="0" width="10" height="10" />
        </g>
      </svg>
    `);

    applySecureNowQuestionSubjectHighlight(svg, "seed");

    const seed = svg.querySelector("#flowchart-seed-0");
    const neighbor = svg.querySelector("#flowchart-neighbor-1");

    expect(seed?.getAttribute("data-securenow-question-subject")).toBe("true");
    expect(neighbor?.getAttribute("data-securenow-question-subject")).toBeNull();
  });
});
