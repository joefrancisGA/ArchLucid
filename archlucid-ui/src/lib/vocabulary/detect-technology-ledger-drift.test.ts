import { describe, expect, it } from "vitest";

import { detectTechnologyLedgerDrift } from "@/lib/vocabulary/detect-technology-ledger-drift";
import type { TechnologyLedgerEntry } from "@/types/technology-ledger";

function entry(
  overrides: Partial<TechnologyLedgerEntry> & Pick<TechnologyLedgerEntry, "entryId" | "role" | "status" | "providerFamily">,
): TechnologyLedgerEntry {
  return {
    runId: "run-1",
    technologyName: "Example",
    source: "AgentProposed",
    evidenceRef: null,
    rationale: null,
    isLocked: false,
    createdUtc: "2026-01-01T00:00:00.000Z",
    updatedUtc: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("detectTechnologyLedgerDrift", () => {
  it("flags multiple Chosen rows for the same role with different providers", () => {
    const warnings = detectTechnologyLedgerDrift([
      entry({ entryId: "a", role: "PrimaryDatastore", status: "Chosen", providerFamily: "Azure" }),
      entry({ entryId: "b", role: "PrimaryDatastore", status: "Chosen", providerFamily: "Aws" }),
    ]);

    expect(warnings).toEqual([
      expect.objectContaining({
        code: "duplicate-chosen-provider",
        role: "PrimaryDatastore",
      }),
    ]);
  });

  it("flags Assumed rows that conflict with the Chosen provider for the same role", () => {
    const warnings = detectTechnologyLedgerDrift([
      entry({ entryId: "a", role: "CloudPlatform", status: "Chosen", providerFamily: "Azure" }),
      entry({ entryId: "b", role: "CloudPlatform", status: "Assumed", providerFamily: "Aws" }),
    ]);

    expect(warnings).toEqual([
      expect.objectContaining({
        code: "assumed-chosen-conflict",
        role: "CloudPlatform",
      }),
    ]);
  });

  it("returns no warnings for aligned Chosen and Assumed rows", () => {
    const warnings = detectTechnologyLedgerDrift([
      entry({ entryId: "a", role: "Messaging", status: "Chosen", providerFamily: "Azure" }),
      entry({ entryId: "b", role: "Messaging", status: "Assumed", providerFamily: "Azure" }),
    ]);

    expect(warnings).toEqual([]);
  });
});
