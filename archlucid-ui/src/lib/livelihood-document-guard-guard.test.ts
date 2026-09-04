import { describe, expect, it } from "vitest";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import {
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
    expect(LIVELIHOOD_DOCUMENT_GUARD_DEFERRED_SURFACES).toContain("integrations/azure-boards-connection");
  });

  it("keeps guarded document roots wired to useLivelihoodDocumentGuards", () => {
    expect(findSurfaceMarkerViolations(UI_ROOT, LIVELIHOOD_DOCUMENT_GUARD_SURFACES)).toEqual([]);
  });

  it("keeps primitive-composed draft workspace on the shared guard stack", () => {
    expect(findSurfaceMarkerViolations(UI_ROOT, LIVELIHOOD_DOCUMENT_GUARD_PRIMITIVE_SURFACES)).toEqual([]);
  });
});
