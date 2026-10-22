import { describe, expect, it } from "vitest";

import {
  INHABIT_THE_ARCHITECTURE_HELP_COMPARISON_ROWS,
  INHABIT_THE_ARCHITECTURE_HELP_FORBIDDEN_LINK_MARKERS,
  INHABIT_THE_ARCHITECTURE_HELP_FORBIDDEN_USER_LABELS,
  INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS,
  INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN,
  INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_MID_ANALYSIS_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF,
  INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS,
  INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY,
  INHABIT_THE_ARCHITECTURE_HELP_SOURCES_ACTIONS,
} from "@/lib/inhabit/inhabit-help-guide-content";
import { WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY } from "@/lib/governance/working-career-rehearsal-door-shortcuts";

describe("inhabit-help-guide-content (IH-014 / HIN Phase 2)", () => {
  it("maps career and rehearsal technical ids to Record and Practice labels", () => {
    const technicalRow = INHABIT_THE_ARCHITECTURE_HELP_COMPARISON_ROWS.find((row) => row.aspect === "Technical id");

    expect(technicalRow?.record).toBe("career");
    expect(technicalRow?.practice).toBe("rehearsal");
  });

  it("canonicalizes Record vs Practice help to career-vs-rehearsal", () => {
    expect(INHABIT_THE_ARCHITECTURE_HELP_RECORD_PRACTICE_TOPIC_HREF).toBe("/help/career-vs-rehearsal");
    expect(INHABIT_THE_ARCHITECTURE_HELP_SOURCES_ACTIONS.some((action) => action.href.includes("career-rehearsal-doors"))).toBe(
      false,
    );
  });

  it("documents Alt+Shift+E and mid-analysis confirm copy", () => {
    expect(INHABIT_THE_ARCHITECTURE_HELP_KEYBOARD_SHORTCUT_BODY.toLowerCase()).toContain(
      WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY,
    );
    expect(INHABIT_THE_ARCHITECTURE_HELP_MID_ANALYSIS_BODY).toMatch(/in-flight/i);
  });

  it("purges deprecated Career/Rehearsal user-facing labels from inhabit copy", () => {
    const serialized = JSON.stringify({
      simulator: INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY,
      sketch: INHABIT_THE_ARCHITECTURE_HELP_SKETCH_PRACTICE_BODY,
      headings: INHABIT_THE_ARCHITECTURE_HELP_GUIDE_HEADINGS,
    });

    for (const label of INHABIT_THE_ARCHITECTURE_HELP_FORBIDDEN_USER_LABELS) {
      expect(serialized).not.toContain(label);
    }

    expect(INHABIT_THE_ARCHITECTURE_HELP_RECORD_SIMULATOR_BODY).toContain('not “Record blocked,”');
  });

  it("uses in-app help links only — no GitHub blob URLs", () => {
    const serialized = JSON.stringify({
      primary: INHABIT_THE_ARCHITECTURE_HELP_PRIMARY_ACTION,
      related: INHABIT_THE_ARCHITECTURE_HELP_RELATED_TOPICS,
      actions: INHABIT_THE_ARCHITECTURE_HELP_SOURCES_ACTIONS,
    });

    for (const marker of INHABIT_THE_ARCHITECTURE_HELP_FORBIDDEN_LINK_MARKERS) {
      expect(serialized).not.toContain(marker);
    }

    expect(INHABIT_THE_ARCHITECTURE_HELP_HELP_RETURN.href.startsWith("/help")).toBe(true);
  });
});
