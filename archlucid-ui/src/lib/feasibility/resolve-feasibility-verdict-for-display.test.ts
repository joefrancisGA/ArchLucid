import { describe, expect, it } from "vitest";

import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { resolveFeasibilityVerdictForDisplay } from "./resolve-feasibility-verdict-for-display";

describe("resolveFeasibilityVerdictForDisplay", () => {
  it("keeps soft infeasible labeling and export lead", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "SoftInfeasible",
      summary: "Envelope breach at scale.",
    };

    const resolved = resolveFeasibilityVerdictForDisplay(verdict);

    expect(resolved.kindLabel).toBe("Remediate");
    expect(resolved.missingHardCitationDefect).toBe(false);
    expect(resolved.leadsPackageSurfaces).toBe(true);
  });

  it("does not label hard infeasible when citation is missing", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "HardInfeasible",
      summary: "Required controls cannot be satisfied.",
    };

    const resolved = resolveFeasibilityVerdictForDisplay(verdict);

    expect(resolved.missingHardCitationDefect).toBe(true);
    expect(resolved.kindLabel).not.toMatch(/hard infeasible/i);
    expect(resolved.tone).toBe("warning");
    expect(resolved.leadsPackageSurfaces).toBe(true);
  });

  it("accepts unsat core keys as hard citation backing", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "HardInfeasible",
      summary: "Invariant contradiction.",
      unsatCoreInvariantKeys: ["INV-AVAIL-001", "INV-CONSIST-001"],
    };

    const resolved = resolveFeasibilityVerdictForDisplay(verdict);

    expect(resolved.missingHardCitationDefect).toBe(false);
    expect(resolved.kindLabel).toBe("Hold");
    expect(resolved.tone).toBe("danger");
  });
});
