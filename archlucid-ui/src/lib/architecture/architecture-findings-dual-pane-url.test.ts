import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_FINDING_PARAM,
  architectureDiagramFindingHrefFromSearch,
  parseArchitectureDiagramFindingIdFromSearch,
} from "./architecture-findings-dual-pane-url";

describe("architecture-findings-dual-pane-url (LS-01)", () => {
  it("prefers findingId over diagramFindingId alias", () => {
    expect(
      parseArchitectureDiagramFindingIdFromSearch("finding-a", "finding-b"),
    ).toBe("finding-a");
  });

  it("hydrates from diagramFindingId when findingId is absent", () => {
    expect(parseArchitectureDiagramFindingIdFromSearch(null, "finding-legacy")).toBe(
      "finding-legacy",
    );
  });

  it("writes findingId and drops diagramFindingId alias", () => {
    const href = architectureDiagramFindingHrefFromSearch(
      `tab=architecture&${ARCHITECTURE_DIAGRAM_FINDING_PARAM}=old-id`,
      "finding-7",
      "/architecture/reviews/run-1",
    );

    expect(href).toContain("findingId=finding-7");
    expect(href).not.toContain(`${ARCHITECTURE_DIAGRAM_FINDING_PARAM}=`);
  });

  it("clears both params when selection is cleared", () => {
    const href = architectureDiagramFindingHrefFromSearch(
      `findingId=finding-7&${ARCHITECTURE_DIAGRAM_FINDING_PARAM}=finding-7`,
      null,
      "/architecture/reviews/run-1",
    );

    expect(href).toBe("/architecture/reviews/run-1");
  });
});
