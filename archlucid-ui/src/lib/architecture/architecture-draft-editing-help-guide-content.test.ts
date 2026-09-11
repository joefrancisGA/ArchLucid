import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_HANDOFF_MARKERS,
  ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_FORBIDDEN_LINK_MARKERS,
  ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_COPY,
  ARCHITECTURE_DRAFT_EDITING_HELP_OVERVIEW,
} from "@/lib/architecture/architecture-draft-editing-help-guide-content";

describe("architecture-draft-editing-help-guide-content (LW-094)", () => {
  it("does not use live presence or collab-editor promises", () => {
    const corpus = [
      ARCHITECTURE_DRAFT_EDITING_HELP_OVERVIEW,
      ARCHITECTURE_DRAFT_EDITING_HELP_LEASE_COPY,
      ARCHITECTURE_DRAFT_EDITING_HELP_CONFLICT_COPY,
      ARCHITECTURE_DRAFT_EDITING_HELP_BOUNDARY_COPY,
    ].join(" ");

    expect(corpus.toLowerCase()).not.toMatch(/\bonline\b/);
    expect(corpus.toLowerCase()).not.toMatch(/real-time collab/);
    expect(corpus).toMatch(/not live presence/i);
    expect(corpus).toMatch(/keep mine/i);
    expect(corpus.toLowerCase()).not.toMatch(/live occupancy/);
  });

  it("keeps in-app handoffs only", () => {
    for (const marker of ARCHITECTURE_DRAFT_EDITING_HELP_FORBIDDEN_LINK_MARKERS) {
      for (const handoff of ARCHITECTURE_DRAFT_EDITING_HELP_CANONICAL_HANDOFF_MARKERS) {
        expect(handoff).not.toContain(marker);
      }
    }
  });
});
