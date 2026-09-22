import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY_DOC_PATH,
  parseWorkingCareerRehearsalDoorFromSearch,
  resolveWorkingCareerRehearsalDoorFromSearch,
  tryParseWorkingCareerRehearsalDoorQueryValue,
  WORKING_CAREER_REHEARSAL_DOOR_NON_DOOR_QUERY_KEYS,
  WORKING_CAREER_REHEARSAL_DOOR_QUERY_KEYS,
} from "@/lib/governance/working-career-rehearsal-door-query";

const REPO_ROOT = join(process.cwd(), "..");

describe("working-career-rehearsal-door-query (CG-013)", () => {
  it("documents every door-implying and non-door query key", () => {
    const markdown = readFileSync(join(REPO_ROOT, CAREER_GRAVITY_URL_QUERY_DOOR_INVENTORY_DOC_PATH), "utf8");

    expect(markdown).toMatch(/\?career=1/);
    expect(markdown).toMatch(/screenshot fraud/);

    for (const key of WORKING_CAREER_REHEARSAL_DOOR_QUERY_KEYS) {
      expect(markdown).toContain("`" + key + "`");
    }

    for (const key of WORKING_CAREER_REHEARSAL_DOOR_NON_DOOR_QUERY_KEYS) {
      expect(markdown).toContain("`" + key + "`");
    }
  });

  it("parses explicit door keys and truthy career/rehearsal flags", () => {
    expect(tryParseWorkingCareerRehearsalDoorQueryValue("Career")).toBe("career");
    expect(tryParseWorkingCareerRehearsalDoorQueryValue("full")).toBeNull();
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("door=rehearsal"))).toBe(
      "rehearsal",
    );
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("career=1"))).toBe("career");
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("rehearsal=true"))).toBe(
      "rehearsal",
    );
    expect(
      parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("career=1&rehearsal=1")),
    ).toBe("rehearsal");
    expect(
      parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("workingCareerRehearsalDoor=career")),
    ).toBe("career");
  });

  it("does not treat wizard mode or clone intent as a door", () => {
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("mode=full"))).toBeNull();
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("intent=revised-clone"))).toBe(
      null,
    );
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("executionMode=Real"))).toBeNull();
    expect(parseWorkingCareerRehearsalDoorFromSearch(new URLSearchParams("door=full"))).toBeNull();
  });

  it("ignores ?career=1 on structural Simulator so the deep link cannot mint unlabeled Career", () => {
    const result = resolveWorkingCareerRehearsalDoorFromSearch({
      search: new URLSearchParams("career=1"),
      storedDoor: "rehearsal",
      structuralExecutionMode: "Simulator",
      applyQuery: true,
    });

    expect(result.requestedDoor).toBe("career");
    expect(result.ignoredCareerQuery).toBe(true);
    expect(result.door).toBe("rehearsal");
  });

  it("ignores Career query while structural Mode is unknown", () => {
    const result = resolveWorkingCareerRehearsalDoorFromSearch({
      search: new URLSearchParams("door=career"),
      storedDoor: "rehearsal",
      structuralExecutionMode: null,
      applyQuery: true,
    });

    expect(result.ignoredCareerQuery).toBe(true);
    expect(result.door).toBe("rehearsal");
  });

  it("overlays Career from query only when structural Mode is Real", () => {
    const result = resolveWorkingCareerRehearsalDoorFromSearch({
      search: new URLSearchParams("career=1"),
      storedDoor: "rehearsal",
      structuralExecutionMode: "Real",
      applyQuery: true,
    });

    expect(result.ignoredCareerQuery).toBe(false);
    expect(result.door).toBe("career");
  });

  it("overlays Rehearsal from query on Simulator (labeled, not fraud)", () => {
    const result = resolveWorkingCareerRehearsalDoorFromSearch({
      search: new URLSearchParams("rehearsal=1"),
      storedDoor: "career",
      structuralExecutionMode: "Simulator",
      applyQuery: true,
    });

    expect(result.door).toBe("rehearsal");
    expect(result.ignoredCareerQuery).toBe(false);
  });

  it("does not apply query on Guided", () => {
    const result = resolveWorkingCareerRehearsalDoorFromSearch({
      search: new URLSearchParams("career=1"),
      storedDoor: "rehearsal",
      structuralExecutionMode: "Real",
      applyQuery: false,
    });

    expect(result.door).toBe("rehearsal");
    expect(result.ignoredCareerQuery).toBe(false);
  });
});
