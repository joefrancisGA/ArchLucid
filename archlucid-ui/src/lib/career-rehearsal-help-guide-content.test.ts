import { describe, expect, it } from "vitest";

import {
  CAREER_REHEARSAL_HELP_COMPARISON_ROWS,
  CAREER_REHEARSAL_HELP_FORBIDDEN_LINK_MARKERS,
  CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY,
  CAREER_REHEARSAL_HELP_MID_ANALYSIS_BODY,
  CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
  CAREER_REHEARSAL_HELP_RELATED_TOPICS,
  CAREER_REHEARSAL_HELP_SIBLING_TOPIC_BODY,
} from "@/lib/career-rehearsal-help-guide-content";
import { WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY } from "@/lib/governance/working-career-rehearsal-door-shortcuts";

describe("career-rehearsal-help-guide-content (ECX Phase 2)", () => {
  it("maps career and rehearsal technical ids to Record and Practice labels", () => {
    const technicalRow = CAREER_REHEARSAL_HELP_COMPARISON_ROWS.find((row) => row.aspect === "Technical id");

    expect(technicalRow?.record).toBe("career");
    expect(technicalRow?.practice).toBe("rehearsal");
  });

  it("documents Alt+Shift+E and mid-analysis confirm copy", () => {
    expect(CAREER_REHEARSAL_HELP_KEYBOARD_SHORTCUT_BODY.toLowerCase()).toContain(
      WORKING_CAREER_REHEARSAL_DOOR_SHORTCUT_KEY,
    );
    expect(CAREER_REHEARSAL_HELP_MID_ANALYSIS_BODY).toMatch(/in-flight/i);
    expect(CAREER_REHEARSAL_HELP_MID_ANALYSIS_BODY).toMatch(/does not stop the in-flight/i);
  });

  it("disambiguates the sibling career-rehearsal-doors topic", () => {
    expect(CAREER_REHEARSAL_HELP_SIBLING_TOPIC_BODY).toContain("/help/career-vs-rehearsal");
    expect(CAREER_REHEARSAL_HELP_SIBLING_TOPIC_BODY).toContain("/help/career-rehearsal-doors");
  });

  it("uses in-app help links only — no GitHub blob URLs", () => {
    const serialized = JSON.stringify({
      primary: CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
      related: CAREER_REHEARSAL_HELP_RELATED_TOPICS,
      rows: CAREER_REHEARSAL_HELP_COMPARISON_ROWS,
    });

    for (const marker of CAREER_REHEARSAL_HELP_FORBIDDEN_LINK_MARKERS) {
      expect(serialized).not.toContain(marker);
    }

    expect(CAREER_REHEARSAL_HELP_PRIMARY_ACTION.href.startsWith("/help/")).toBe(true);
  });
});
