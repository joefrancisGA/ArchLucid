import { describe, expect, it } from "vitest";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";

import {
  governanceFindingsSearchHrefFromSearch,
  matchesGovernanceFindingsSearchQuery,
  parseGovernanceFindingsSearchQuery,
} from "./governance-findings-queue-search";

function sampleRow(overrides: Partial<GovernanceFindingQueueRow> = {}): GovernanceFindingQueueRow {
  return {
    runId: "run-1",
    runLabel: "Payments modernization",
    manifestId: "manifest-1",
    findingId: "finding-1",
    title: "Unencrypted data at rest",
    severity: "High",
    category: "Security",
    status: "Open",
    recommended: "Enable encryption",
    recordKind: "finding",
    ...overrides,
  };
}

describe("policy findings queue search", () => {
  it("parses and writes ?q= on the findings queue URL", () => {
    expect(parseGovernanceFindingsSearchQuery("payments")).toBe("payments");
    expect(parseGovernanceFindingsSearchQuery(null)).toBe("");
    expect(governanceFindingsSearchHrefFromSearch("filter=open", "payments", "/governance/findings")).toBe(
      "/governance/findings?filter=open&q=payments",
    );
    expect(governanceFindingsSearchHrefFromSearch("q=old", "", "/governance/findings")).toBe(
      "/governance/findings",
    );
  });

  it("matches rows by title, review label, and finding id", () => {
    const row = sampleRow();

    expect(matchesGovernanceFindingsSearchQuery(row, "unencrypted")).toBe(true);
    expect(matchesGovernanceFindingsSearchQuery(row, "payments")).toBe(true);
    expect(matchesGovernanceFindingsSearchQuery(row, "finding-1")).toBe(true);
    expect(matchesGovernanceFindingsSearchQuery(row, "missing")).toBe(false);
    expect(matchesGovernanceFindingsSearchQuery(row, "")).toBe(true);
  });
});
