import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_CANONICAL_PATH } from "@/lib/architecture-drafts-evidence-copy";
import { ARCHITECTURE_DRAFTS_HELP_SOURCES } from "@/lib/architecture-drafts-help-evidence-copy";

describe("architecture-drafts-help-evidence-copy", () => {
  it("excludes action-panel destinations from help Sources", () => {
    const sourceHrefs = ARCHITECTURE_DRAFTS_HELP_SOURCES.map((source) => source.href);

    expect(sourceHrefs).not.toContain(REVIEWS_NEW_PATH);
    expect(sourceHrefs).not.toContain(ARCHITECTURES_NEW_PATH);
    expect(sourceHrefs).not.toContain(ARCHITECTURE_DRAFTS_CANONICAL_PATH);
    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(ARCHITECTURE_DRAFTS_HELP_SOURCES.length).toBeGreaterThan(0);
  });
});
