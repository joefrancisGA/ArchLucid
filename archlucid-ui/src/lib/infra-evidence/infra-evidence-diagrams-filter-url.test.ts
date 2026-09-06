import { describe, expect, it } from "vitest";

import {
  INFRA_DIAGRAMS_DEFAULT_MODE,
  infraDiagramsFilterHrefFromSearch,
  parseInfraDiagramsMermaidModeFromSearch,
  parseInfraDiagramsMermaidViewFromSearch,
  parseInfraDiagramsSeedNodeIdFromSearch,
  parseInfraDiagramsSnapshotIdFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";

describe("infra-evidence-diagrams-filter-url", () => {
  it("parses snapshot, mode, view, and seed node params", () => {
    expect(parseInfraDiagramsSnapshotIdFromSearch("abc")).toBe("abc");
    expect(parseInfraDiagramsMermaidModeFromSearch(null)).toBe(INFRA_DIAGRAMS_DEFAULT_MODE);
    expect(parseInfraDiagramsMermaidModeFromSearch("network")).toBe("network");
    expect(parseInfraDiagramsMermaidModeFromSearch("bogus")).toBe(INFRA_DIAGRAMS_DEFAULT_MODE);
    expect(parseInfraDiagramsMermaidViewFromSearch("executive")).toBe("executive");
    expect(parseInfraDiagramsSeedNodeIdFromSearch("/subscriptions/x")).toBe("/subscriptions/x");
  });

  it("round-trips filter href patches", () => {
    expect(
      infraDiagramsFilterHrefFromSearch("", {
        snapshotId: "snap-1",
        mermaidMode: "network",
        mermaidView: "executive",
        seedNodeId: "node-1",
      }),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1&mermaidMode=network&mermaidView=executive&seedNodeId=node-1");

    expect(
      infraDiagramsFilterHrefFromSearch(
        "snapshotId=snap-1&mermaidMode=network&mermaidView=executive&seedNodeId=node-1",
        {
          mermaidMode: INFRA_DIAGRAMS_DEFAULT_MODE,
          mermaidView: "",
          seedNodeId: "",
        },
      ),
    ).toBe("/governance/infrastructure/diagrams?snapshotId=snap-1");
  });
});
