import { describe, expect, it } from "vitest";

import type { ArchitectureRiskRegisterEntry } from "@/lib/api/governance-stickiness-api";

import { decisionRegisterRows, riskRegisterRows } from "./governance-findings-row-mappers";

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

  it("normalizes surrounding whitespace from risk-register finding ids", () => {
    const entry = {
      findingId: " finding-1 ",
      runId: "run-1",
      manifestId: "manifest-1",
      title: "Whitespace finding",
      severity: "High",
      category: "Privacy",
      statusLabel: "Open",
      agingDays: 1,
      isStale: false,
      evidenceHref: "/graph?runId=run-1",
    } as unknown as ArchitectureRiskRegisterEntry;

    expect(riskRegisterRows([entry])[0]?.findingId).toBe("finding-1");
  });

  it("drops decision-register entries without a decision id before queue rendering", () => {
    const entry = {
      decisionId: undefined,
      manifestId: undefined,
      runId: undefined,
      category: undefined,
      title: undefined,
      selectedOption: undefined,
      rationale: undefined,
      recordedAtUtc: undefined,
    } as unknown as Parameters<typeof decisionRegisterRows>[0][number];

    expect(() => decisionRegisterRows([entry])).not.toThrow();
    expect(decisionRegisterRows([entry])).toEqual([]);
  });
});
