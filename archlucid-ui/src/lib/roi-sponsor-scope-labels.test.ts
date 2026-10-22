import { describe, expect, it } from "vitest";

import manifest from "@/lib/data/roi-sponsor-facing-scope-labels.v1.json";
import {
  resolveSponsorHeadlineScopeLabel,
  resolveSponsorSystemRowScopeLabel,
  resolveSponsorTrailing30DayScopeLabel,
  ROI_NON_ADDITIVITY_CAVEAT,
  ROI_SPONSOR_SCOPE_CODES,
} from "@/lib/roi-sponsor-scope-labels";

describe("roi-sponsor-scope-labels", () => {
  it("prefers server headline scope description", () => {
    const label = resolveSponsorHeadlineScopeLabel({
      headlineSavingsScopeDescription: "Server headline scope",
    });

    expect(label).toBe("Server headline scope");
  });

  it("falls back to canonical manifest headline description", () => {
    const label = resolveSponsorHeadlineScopeLabel({});

    expect(label).toBe(manifest.descriptions.headlineDispositionAware);
    expect(label).toContain("disposition-aware");
  });

  it("falls back to canonical manifest system-row description", () => {
    const label = resolveSponsorSystemRowScopeLabel({});

    expect(label).toBe(manifest.descriptions.systemRowSnapshotPotential);
    expect(label).toContain("do not sum");
  });

  it("falls back to canonical manifest trailing-30d description", () => {
    const label = resolveSponsorTrailing30DayScopeLabel({});

    expect(label).toBe(manifest.descriptions.trailing30DayFindingEvents);
    expect(label).toContain("Counts only");
  });

  it("keeps system-row and trailing-30d labels distinct", () => {
    const system = resolveSponsorSystemRowScopeLabel({
      systemRowSavingsScopeDescription: "Per-system snapshot potential",
    });
    const trailing = resolveSponsorTrailing30DayScopeLabel({
      trailing30DayActivityScopeDescription: "Trailing 30-day counts only",
    });

    expect(system).toContain("snapshot");
    expect(trailing).toContain("30-day");
    expect(system).not.toBe(trailing);
  });

  it("exposes stable scope codes from manifest", () => {
    expect(ROI_SPONSOR_SCOPE_CODES.headlineDispositionAware).toBe(
      manifest.codes.headlineDispositionAware,
    );
  });

  it("exposes non-additivity caveat from manifest", () => {
    expect(ROI_NON_ADDITIVITY_CAVEAT).toBe(manifest.nonAdditivityCaveat);
    expect(ROI_NON_ADDITIVITY_CAVEAT).toContain("do not sum");
  });
});
