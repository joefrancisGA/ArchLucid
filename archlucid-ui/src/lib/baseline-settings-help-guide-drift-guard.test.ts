import { describe, expect, it } from "vitest";

import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_SOURCES,
} from "@/lib/baseline-settings-help-evidence-copy";
import {
  BASELINE_SETTINGS_HELP_GUIDE_HEADINGS,
  BASELINE_SETTINGS_HELP_NEGATION_DRIFT_MARKERS,
  BASELINE_SETTINGS_HELP_OVERVIEW,
  BASELINE_SETTINGS_HELP_PAGE_SUBTITLE,
  BASELINE_SETTINGS_HELP_PRIMARY_ACTION,
  BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE,
} from "@/lib/baseline-settings-help-guide-content";

describe("baseline settings help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of BASELINE_SETTINGS_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(BASELINE_SETTINGS_HELP_START_HERE_CARD_TITLE).not.toBe(BASELINE_SETTINGS_HELP_PRIMARY_ACTION.label);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(BASELINE_SETTINGS_HELP_OVERVIEW).not.toBe(BASELINE_SETTINGS_HELP_PAGE_SUBTITLE);
  });

  it("lists five guide headings including claim discipline", () => {
    expect(BASELINE_SETTINGS_HELP_GUIDE_HEADINGS).toHaveLength(5);
    expect(BASELINE_SETTINGS_HELP_GUIDE_HEADINGS[4]?.id).toBe("where-to-go-next");
    expect(
      BASELINE_SETTINGS_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-baseline-settings-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists baseline settings help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = BASELINE_SETTINGS_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(BASELINE_SETTINGS_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain("/help/baseline-settings");
    expect(sourceHrefs).not.toContain("/administration/baseline");
  });
});
