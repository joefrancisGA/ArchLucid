import { describe, expect, it } from "vitest";

import type { ArchitectureRiskRegisterEntry } from "@/lib/api/governance-stickiness-api";

import { riskRegisterRows } from "./governance-findings-row-mappers";

describe("riskRegisterRows", () => {
  it("drops risk-register entries without a finding id before queue selection", () => {
    const entry = {
      findingId: undefined,
      runId: "run-1",
      manifestId: "manifest-1",
      title: "Malformed finding",
      severity: "High",
      category: "Privacy",
      statusLabel: "Open",
      agingDays: 1,
      isStale: false,
      evidenceHref: "/graph?runId=run-1",
    } as unknown as ArchitectureRiskRegisterEntry;

    expect(riskRegisterRows([entry])).toEqual([]);
  });
});
