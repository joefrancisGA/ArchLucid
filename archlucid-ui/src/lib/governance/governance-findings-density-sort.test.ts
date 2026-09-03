import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { sortGovernanceFindingsRowsBySignal } from "@/lib/governance/governance-findings-density-sort";

function row(
  findingId: string,
  overrides: Partial<GovernanceFindingQueueRow> = {},
): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Run 1",
    manifestId: "manifest-1",
    findingId,
    title: findingId,
    severity: "Medium",
    category: "Network",
    status: "Open",
    recommended: "Review",
    recordKind: "finding",
    ...overrides,
  };
}

describe("sortGovernanceFindingsRowsBySignal", () => {
  it("orders higher insight density before lower density", () => {
    const sorted = sortGovernanceFindingsRowsBySignal([
      row("low", { insightDensityScore: 10, severity: "Low" }),
      row("high", { insightDensityScore: 90, severity: "Low" }),
    ]);

    expect(sorted.map((entry) => entry.findingId)).toEqual(["high", "low"]);
  });

  it("falls back to severity when density scores tie", () => {
    const sorted = sortGovernanceFindingsRowsBySignal([
      row("medium", { severity: "Medium" }),
      row("critical", { severity: "Critical" }),
    ]);

    expect(sorted.map((entry) => entry.findingId)).toEqual(["critical", "medium"]);
  });
});
