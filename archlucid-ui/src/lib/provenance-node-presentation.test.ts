import { describe, expect, it } from "vitest";

import {
  provenanceNodeDisplayName,
  provenanceNodeFilterCategory,
  provenanceNodeMatchesFilter,
  wrapProvenanceLabel,
} from "@/lib/provenance-node-presentation";
import type { ArchitectureLinkageNode } from "@/types/architecture-provenance";

describe("provenance node presentation", () => {
  it("prefers buyer-facing labels over raw type names", () => {
    const node: ArchitectureLinkageNode = {
      id: "n-1",
      type: "ContextSnapshot",
      referenceId: "ctx-1",
      name: "ignored when mapped",
    };

    expect(provenanceNodeDisplayName(node)).toBe("Reviewed source context");
  });

  it("wraps labels to at most two lines", () => {
    const lines = wrapProvenanceLabel("Weekly exception-volume monitoring for intake controls", 18, 2);

    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it("filters nodes by category without deleting data", () => {
    const finding: ArchitectureLinkageNode = {
      id: "f",
      type: "Finding",
      referenceId: "f-1",
      name: "Risk",
    };

    expect(provenanceNodeFilterCategory(finding.type)).toBe("findings");
    expect(provenanceNodeMatchesFilter(finding, new Set(["findings"]))).toBe(true);
    expect(provenanceNodeMatchesFilter(finding, new Set(["artifacts"]))).toBe(false);
  });
});
