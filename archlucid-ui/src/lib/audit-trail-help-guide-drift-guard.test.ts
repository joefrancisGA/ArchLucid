import { describe, expect, it } from "vitest";

import {
  AUDIT_TRAIL_HELP_CANONICAL_PATH,
  AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_HELP_SOURCES,
} from "@/lib/audit-trail-help-evidence-copy";
import {
  AUDIT_TRAIL_HELP_GUIDE_HEADINGS,
  AUDIT_TRAIL_HELP_NEGATION_DRIFT_MARKERS,
  AUDIT_TRAIL_HELP_OVERVIEW,
} from "@/lib/audit-trail-help-guide-content";

describe("audit trail help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of AUDIT_TRAIL_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of AUDIT_TRAIL_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(AUDIT_TRAIL_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("lists guide headings including claim discipline and where-to-go-next", () => {
    expect(
      AUDIT_TRAIL_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "help-audit-trail-claim-discipline-heading"),
    ).toBe(true);
    expect(AUDIT_TRAIL_HELP_GUIDE_HEADINGS.some((heading) => heading.id === "where-to-go-next")).toBe(true);
  });

  it("lists audit trail help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = AUDIT_TRAIL_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(AUDIT_TRAIL_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(AUDIT_TRAIL_HELP_CANONICAL_PATH);
  });
});
