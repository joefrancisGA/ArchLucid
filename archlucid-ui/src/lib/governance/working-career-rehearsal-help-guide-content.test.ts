import { describe, expect, it } from "vitest";

import {
  WORKING_CAREER_DOOR_LABEL,
  WORKING_REHEARSAL_DOOR_LABEL,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import {
  WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES,
  WORKING_CAREER_REHEARSAL_HELP_FORBIDDEN_LINK_MARKERS,
  WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE,
  WORKING_CAREER_REHEARSAL_HELP_OVERVIEW,
  WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE,
  WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
  WORKING_CAREER_REHEARSAL_HELP_RELATED,
  WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY,
  WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY,
} from "@/lib/governance/working-career-rehearsal-help-guide-content";

describe("working-career-rehearsal-help-guide-content (AS-082)", () => {
  it("names both Career and Rehearsal doors in the help topic", () => {
    expect(WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE).toContain("Career");
    expect(WORKING_CAREER_REHEARSAL_HELP_PAGE_TITLE).toContain("Rehearsal");
    expect(WORKING_CAREER_REHEARSAL_HELP_OVERVIEW).toContain(WORKING_CAREER_DOOR_LABEL);
    expect(WORKING_CAREER_REHEARSAL_HELP_OVERVIEW).toContain(WORKING_REHEARSAL_DOOR_LABEL);

    const doorLabels = WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES.map((tile) => tile.label);

    expect(doorLabels).toEqual([WORKING_CAREER_DOOR_LABEL, WORKING_REHEARSAL_DOOR_LABEL]);
  });

  it("states Rehearsal is practice and Simulator is not sponsor proof", () => {
    expect(WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY.toLowerCase()).toContain("sponsor");
    expect(WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY.toLowerCase()).toContain("rehearsal");
    expect(WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES[1]?.whenToUse.toLowerCase()).toContain("practice");
  });

  it("documents Guided split without the Career chooser", () => {
    expect(WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE).toContain("Guided");
    expect(WORKING_CAREER_REHEARSAL_HELP_GUIDED_NOTE).not.toContain("github.com");
  });

  it("documents the SecureNow product-line omission of Career / Rehearsal chrome", () => {
    expect(WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY).toContain("SecureNow");
    expect(WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY).toContain("Career");
    expect(WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY).toContain("Rehearsal");
    expect(WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY).not.toContain("github.com");
  });

  it("uses in-app help links only — no GitHub blob URLs", () => {
    const serialized = JSON.stringify({
      overview: WORKING_CAREER_REHEARSAL_HELP_OVERVIEW,
      honesty: WORKING_CAREER_REHEARSAL_HELP_SIMULATOR_HONESTY_COPY,
      security: WORKING_CAREER_REHEARSAL_HELP_SECURITY_COPY,
      primary: WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION,
      related: WORKING_CAREER_REHEARSAL_HELP_RELATED,
      tiles: WORKING_CAREER_REHEARSAL_HELP_DOOR_TILES,
    });

    for (const marker of WORKING_CAREER_REHEARSAL_HELP_FORBIDDEN_LINK_MARKERS) {
      expect(serialized).not.toContain(marker);
    }

    expect(WORKING_CAREER_REHEARSAL_HELP_PRIMARY_ACTION.href.startsWith("/help/")).toBe(true);
    expect(WORKING_CAREER_REHEARSAL_HELP_RELATED.href.startsWith("/help/")).toBe(true);
  });
});
