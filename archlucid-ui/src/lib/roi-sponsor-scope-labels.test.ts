import { describe, expect, it } from "vitest";

import {
  resolveExecutiveHeadlineScopeLabel,
  resolveExecutiveSystemRowScopeLabel,
  resolveExecutiveTrailing30DayScopeLabel,
} from "@/lib/roi-sponsor-scope-labels";

describe("roi-sponsor-scope-labels", () => {
  it("prefers server headline scope description", () => {
    const label = resolveExecutiveHeadlineScopeLabel({
      headlineSavingsScopeDescription: "Server headline scope",
    });

    expect(label).toBe("Server headline scope");
  });

  it("falls back when scope description is missing", () => {
    const label = resolveExecutiveHeadlineScopeLabel({});

    expect(label).toContain("disposition-aware");
  });

  it("keeps system-row and trailing-30d labels distinct", () => {
    const system = resolveExecutiveSystemRowScopeLabel({
      systemRowSavingsScopeDescription: "Per-system snapshot potential",
    });
    const trailing = resolveExecutiveTrailing30DayScopeLabel({
      trailing30DayActivityScopeDescription: "Trailing 30-day counts only",
    });

    expect(system).toContain("snapshot");
    expect(trailing).toContain("30-day");
    expect(system).not.toBe(trailing);
  });
});
