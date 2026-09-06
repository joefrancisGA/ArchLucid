import { describe, expect, it } from "vitest";

import {
  INFRA_DIAGRAMS_DEFAULT_MODE,
  buildDiagramsWorkbenchHref,
  infraDiagramsFilterHrefFromSearch,
  parseInfraDiagramsCloudResourceIdFromSearch,
  parseInfraDiagramsMermaidModeFromSearch,
  parseInfraDiagramsMermaidViewFromSearch,
  parseInfraDiagramsSeedNodeIdFromSearch,
  parseInfraDiagramsSnapshotIdFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";

describe("infra-evidence-diagrams-filter-url", () => {
  it("parses snapshot, mode, view, seed node, and cloud resource params", () => {
    expect(parseInfraDiagramsSnapshotIdFromSearch("abc")).toBe("abc");
    expect(parseInfraDiagramsCloudResourceIdFromSearch("11111111-1111-1111-1111-111111111111")).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
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

  it("builds scoped diagrams workbench href with cloudResourceId", () => {
    expect(
      buildDiagramsWorkbenchHref({
        snapshotId: "22222222-2222-2222-2222-222222222222",
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
      }),
    ).toBe(
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });
});
