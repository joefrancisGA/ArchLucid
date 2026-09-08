import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_PATH, ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_CANONICAL_PATH } from "@/lib/architecture-drafts-evidence-copy";
import {
  ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH,
  ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE,
  ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES,
  ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES_INTRO,
  ARCHITECTURE_DRAFTS_HELP_SOURCES,
} from "@/lib/architecture-drafts-help-evidence-copy";

describe("architecture-drafts-help-evidence-copy", () => {
  it("excludes action-panel destinations from help Sources", () => {
    const sourceHrefs = ARCHITECTURE_DRAFTS_HELP_SOURCES.map((source) => source.href);

    expect(sourceHrefs).not.toContain(REVIEWS_NEW_PATH);
    expect(sourceHrefs).not.toContain(ARCHITECTURES_NEW_PATH);
    expect(sourceHrefs).not.toContain(ARCHITECTURE_DRAFTS_CANONICAL_PATH);
    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(ARCHITECTURE_DRAFTS_HELP_SOURCES.length).toBeGreaterThan(0);
  });

  it("exports non-empty orientation Sources for HAR", () => {
    expect(ARCHITECTURE_DRAFTS_HELP_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE).toContain("This guide orients");
    expect(ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of ARCHITECTURE_DRAFTS_HELP_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(ARCHITECTURE_DRAFTS_HELP_CANONICAL_PATH);
    }
  });
});
