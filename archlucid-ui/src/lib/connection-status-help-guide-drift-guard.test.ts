import { describe, expect, it } from "vitest";

import { CONNECTION_STATUS_HELP_CANONICAL_PATH } from "@/lib/connection-status-help-evidence-copy";
import {
  CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE,
  CONNECTION_STATUS_HELP_SOURCES,
} from "@/lib/connection-status-help-evidence-copy";
import {
  CONNECTION_STATUS_HELP_GUIDE_HEADINGS,
  CONNECTION_STATUS_HELP_NEGATION_DRIFT_MARKERS,
  CONNECTION_STATUS_HELP_OVERVIEW,
  CONNECTION_STATUS_HELP_PAGE_SUBTITLE,
  CONNECTION_STATUS_HELP_PRIMARY_ACTION,
} from "@/lib/connection-status-help-guide-content";

describe("connection status help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of CONNECTION_STATUS_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(
        CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE.toLowerCase(),
        `claim must not contain "${phrase}"`,
      ).not.toContain(phrase);
    }
  });

  it("keeps overview free of diligence negation drift", () => {
    for (const phrase of CONNECTION_STATUS_HELP_NEGATION_DRIFT_MARKERS.overviewMustNotContain) {
      expect(CONNECTION_STATUS_HELP_OVERVIEW.toLowerCase(), `overview must not contain "${phrase}"`).not.toContain(
        phrase.toLowerCase(),
      );
    }
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(CONNECTION_STATUS_HELP_OVERVIEW).not.toBe(CONNECTION_STATUS_HELP_PAGE_SUBTITLE);
  });

  it("lists six guide headings including claim discipline", () => {
    expect(CONNECTION_STATUS_HELP_GUIDE_HEADINGS).toHaveLength(6);
    expect(CONNECTION_STATUS_HELP_GUIDE_HEADINGS[5]?.id).toBe("where-to-go-next");
    expect(
      CONNECTION_STATUS_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-connection-status-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists connection status help sources with unique hrefs and no help self-href", () => {
    const sourceHrefs = CONNECTION_STATUS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(CONNECTION_STATUS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain(CONNECTION_STATUS_HELP_CANONICAL_PATH);
  });
});
