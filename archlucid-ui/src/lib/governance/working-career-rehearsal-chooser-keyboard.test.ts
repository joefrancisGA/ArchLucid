import { describe, expect, it } from "vitest";

import {
  resolveWorkingCareerRehearsalDoorFromSegmentKeyboard,
  shouldRegisterWorkingCareerRehearsalChooserShortcut,
} from "@/lib/governance/working-career-rehearsal-chooser-keyboard";

describe("CG-016 chooser keyboard", () => {
  it("registers the global cycle shortcut only on the command-bar mount", () => {
    expect(shouldRegisterWorkingCareerRehearsalChooserShortcut("command-bar")).toBe(true);
    expect(shouldRegisterWorkingCareerRehearsalChooserShortcut("findings")).toBe(false);
  });

  it("moves Career/Rehearsal with horizontal arrow keys", () => {
    expect(resolveWorkingCareerRehearsalDoorFromSegmentKeyboard("career", "ArrowRight")).toBe(
      "rehearsal",
    );
    expect(resolveWorkingCareerRehearsalDoorFromSegmentKeyboard("rehearsal", "ArrowRight")).toBe(
      "career",
    );
    expect(resolveWorkingCareerRehearsalDoorFromSegmentKeyboard("rehearsal", "ArrowLeft")).toBe(
      "career",
    );
    expect(resolveWorkingCareerRehearsalDoorFromSegmentKeyboard("career", "Home")).toBe("career");
    expect(resolveWorkingCareerRehearsalDoorFromSegmentKeyboard("career", "End")).toBe("rehearsal");
    expect(resolveWorkingCareerRehearsalDoorFromSegmentKeyboard("career", "a")).toBeNull();
  });
});
