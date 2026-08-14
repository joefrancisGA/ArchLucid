import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_SOURCES,
} from "@/lib/decision-register-help-evidence-copy";
import {
  DECISION_REGISTER_HELP_GUIDE_HEADINGS,
  DECISION_REGISTER_HELP_NEGATION_DRIFT_MARKERS,
  DECISION_REGISTER_HELP_OVERVIEW,
  DECISION_REGISTER_HELP_PAGE_SUBTITLE,
  DECISION_REGISTER_HELP_PRIMARY_ACTION,
  DECISION_REGISTER_HELP_START_HERE_CARD_TITLE,
} from "@/lib/decision-register-help-guide-content";

describe("decision register help drift guard", () => {
  it("keeps claim discipline free of Sources package jargon", () => {
    for (const phrase of DECISION_REGISTER_HELP_NEGATION_DRIFT_MARKERS.claimMustNotContain) {
      expect(DECISION_REGISTER_HELP_CLAIM_DISCIPLINE.toLowerCase(), `claim must not contain "${phrase}"`).not.toContain(
        phrase,
      );
    }
  });

  it("uses distinct Start here card title and primary action label", () => {
    expect(DECISION_REGISTER_HELP_START_HERE_CARD_TITLE).not.toBe(DECISION_REGISTER_HELP_PRIMARY_ACTION.label);
  });

  it("keeps overview distinct from the page subtitle", () => {
    expect(DECISION_REGISTER_HELP_OVERVIEW).not.toBe(DECISION_REGISTER_HELP_PAGE_SUBTITLE);
  });

  it("lists four guide headings including claim discipline", () => {
    expect(DECISION_REGISTER_HELP_GUIDE_HEADINGS).toHaveLength(4);
    expect(DECISION_REGISTER_HELP_GUIDE_HEADINGS[3]?.id).toBe("where-to-go-next");
    expect(
      DECISION_REGISTER_HELP_GUIDE_HEADINGS.some(
        (heading) => heading.id === "help-decision-register-claim-discipline-heading",
      ),
    ).toBe(true);
  });

  it("lists decision register help sources with unique hrefs and no self-href", () => {
    const sourceHrefs = DECISION_REGISTER_HELP_SOURCES.map((source) => source.href);

    expect(new Set(sourceHrefs).size).toBe(sourceHrefs.length);
    expect(DECISION_REGISTER_HELP_SOURCES.every((source) => source.href.startsWith("/"))).toBe(true);
    expect(sourceHrefs).not.toContain("/help/decision-register");
  });
});
