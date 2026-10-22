import { afterEach, describe, expect, it, vi } from "vitest";

import {
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY,
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_LABEL,
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_HEADING,
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_LEAD,
  EVIDENCE_GRAPH_FIRST_OPEN_COACH_SECTIONS,
  buildEvidenceGraphFirstOpenCoach,
  dismissEvidenceGraphFirstOpenCoach,
  isEvidenceGraphFirstOpenCoachDismissed,
} from "@/lib/evidence-graph-first-open-coach";

describe("evidence-graph-first-open-coach (TB-2244)", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("teaches what/when/modes/when-not in buyer nouns", () => {
    const model = buildEvidenceGraphFirstOpenCoach();

    expect(model.heading).toBe(EVIDENCE_GRAPH_FIRST_OPEN_COACH_HEADING);
    expect(model.lead).toBe(EVIDENCE_GRAPH_FIRST_OPEN_COACH_LEAD);
    expect(model.lead.toLowerCase()).toContain("evidence graph");
    expect(model.lead.toLowerCase()).toContain("architecture package");
    expect(model.dismissLabel).toBe(EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_LABEL);

    expect(model.sections).toEqual(EVIDENCE_GRAPH_FIRST_OPEN_COACH_SECTIONS);
    expect(model.sections.map((section) => section.id)).toEqual([
      "what",
      "when",
      "modes",
      "when-not",
    ]);
    expect(model.sections[0]?.body.toLowerCase()).toContain("evidence trail");
    expect(model.sections[1]?.body.toLowerCase()).toContain("review");
    expect(model.sections[2]?.body.toLowerCase()).toContain("provenance");
    expect(model.sections[3]?.body.toLowerCase()).toContain("search");
  });

  it("reads and writes the localStorage dismiss key", () => {
    expect(isEvidenceGraphFirstOpenCoachDismissed()).toBe(false);

    dismissEvidenceGraphFirstOpenCoach();

    expect(window.localStorage.getItem(EVIDENCE_GRAPH_FIRST_OPEN_COACH_DISMISS_KEY)).toBe("1");
    expect(isEvidenceGraphFirstOpenCoachDismissed()).toBe(true);
  });

  it("treats localStorage failures as dismissed (private mode)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("quota");
    });

    expect(isEvidenceGraphFirstOpenCoachDismissed()).toBe(true);
  });
});
