import { describe, expect, it } from "vitest";

import { parseItsmLinkedTicketSummary } from "@/components/findings/ItsmLinkedTicketStatusChip";
import { buildFindingsSavedViewPayload } from "@/lib/governance/governance-findings-saved-view-helpers";

describe("parseItsmLinkedTicketSummary", () => {
  it("parses ticket key and state pairs", () => {
    expect(parseItsmLinkedTicketSummary("ARCH-101 (In Progress), ARCH-88 (Closed)")).toEqual([
      { key: "ARCH-101", state: "In Progress" },
      { key: "ARCH-88", state: "Closed" },
    ]);
  });

  it("returns empty for blank summary", () => {
    expect(parseItsmLinkedTicketSummary("   ")).toEqual([]);
  });
});

describe("buildFindingsSavedViewPayload", () => {
  it("serializes findings queue filters", () => {
    const payload = buildFindingsSavedViewPayload({
      registerFilter: "open",
      jobView: "security",
      nlFacets: { severity: "High" },
      groupByResource: true,
      scopedRunId: "run-1",
    });

    expect(payload.filters).toMatchObject({
      registerFilter: "open",
      jobView: "security",
      groupByResource: true,
      scopedRunId: "run-1",
    });
  });
});
