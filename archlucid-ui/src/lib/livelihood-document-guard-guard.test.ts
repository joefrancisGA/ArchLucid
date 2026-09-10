import { describe, expect, it } from "vitest";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import {
  findLivelihoodDocumentGuardDeferredShrinkViolations,
  findLivelihoodDocumentGuardInventoryViolations,
} from "@/lib/livelihood-document-guard-guard";
import {
  LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE,
  LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES,
  LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES,
  LIVELIHOOD_DOCUMENT_GUARD_SURFACES,
} from "@/lib/livelihood-document-guard-inventory";

const UI_ROOT = process.cwd();

describe("livelihood-document-guard inventory (RS-07)", () => {
  it("documents guarded operator document surfaces", () => {
    const surfaceIds = LIVELIHOOD_DOCUMENT_GUARD_SURFACES.map((surface) => surface.id);

    expect(surfaceIds).toContain("policy-pack-authoring");
    expect(surfaceIds).toContain("sso-wizard");
    expect(surfaceIds).toContain("alert-rules-create");
    expect(surfaceIds).toContain("finding-inspect-disposition");
    expect(surfaceIds).toContain("finding-mute-reason");
    expect(surfaceIds).toContain("integrations/azure-boards-connection");
    expect(surfaceIds).toContain("integrations/servicenow-settings");
    expect(surfaceIds).toContain("integrations/jira-workspace-routing");
    expect(surfaceIds).toContain("integrations/teams-connection");
    expect(surfaceIds).toContain("governance/risk-exception-renew");
    expect(surfaceIds).toContain("tenant-cost-settings");
  });

  it("documents deferred livelihood guard surfaces with explicit reasons", () => {
    expect(LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES.length).toBe(
      LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_COUNT_BASELINE,
    );

    for (const surface of LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES) {
      expect(surface.reason.trim().length).toBeGreaterThan(0);
      expect(surface.sourceRoots.length).toBeGreaterThan(0);
    }
  });

  it("keeps guarded document roots wired to useLivelihoodDocumentGuards", () => {
    expect(findSurfaceMarkerViolations(UI_ROOT, LIVELIHOOD_DOCUMENT_GUARD_SURFACES)).toEqual([]);
  });

  it("keeps primitive-composed draft workspace on the shared guard stack", () => {
    expect(findSurfaceMarkerViolations(UI_ROOT, LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES)).toEqual([]);
  });
});

describe("livelihood-document-guard shrink ratchet (LP-11)", () => {
  it("keeps architecture/review dirty forms guarded or explicitly deferred", () => {
    expect(findLivelihoodDocumentGuardInventoryViolations(UI_ROOT)).toEqual([]);
  });

  it("keeps the deferred inventory at or below the LP-11 baseline count", () => {
    expect(findLivelihoodDocumentGuardDeferredShrinkViolations()).toEqual([]);
  });
});
