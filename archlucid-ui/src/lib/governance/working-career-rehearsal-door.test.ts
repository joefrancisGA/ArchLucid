import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  readWorkingCareerRehearsalDoorFromStorage,
  resolveWorkingCareerRehearsalDoorScope,
  shouldSuppressReadyToFinalizeForWorkingRehearsalDoor,
  WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY,
  workingCareerRehearsalArchitectureStorageKey,
  writeWorkingCareerRehearsalDoorToStorage,
} from "@/lib/governance/working-career-rehearsal-door";

describe("working-career-rehearsal-door", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to rehearsal when no preference is stored", () => {
    expect(DEFAULT_WORKING_CAREER_REHEARSAL_DOOR).toBe("rehearsal");
    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("rehearsal");
  });

  it("persists tenant-level door preference", () => {
    writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, "career");

    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY)).toBe("career");
    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("career");
  });

  it("prefers architecture-level preference over tenant default", () => {
    writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, "career");
    writeWorkingCareerRehearsalDoorToStorage(
      { kind: "architecture", architectureId: "architecture-001" },
      "rehearsal",
    );

    expect(
      readWorkingCareerRehearsalDoorFromStorage({
        kind: "architecture",
        architectureId: "architecture-001",
      }),
    ).toBe("rehearsal");
  });

  it("falls back to tenant preference when architecture scope has no explicit value", () => {
    writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, "career");

    expect(
      readWorkingCareerRehearsalDoorFromStorage({
        kind: "architecture",
        architectureId: "architecture-002",
      }),
    ).toBe("career");
  });

  it("suppresses Ready labels on Working Rehearsal door (AS-079)", () => {
    expect(
      shouldSuppressReadyToFinalizeForWorkingRehearsalDoor({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      }),
    ).toBe(true);
    expect(
      shouldSuppressReadyToFinalizeForWorkingRehearsalDoor({
        workingDesk: true,
        effectiveWorkingCareerRehearsalDoor: "career",
      }),
    ).toBe(false);
    expect(
      shouldSuppressReadyToFinalizeForWorkingRehearsalDoor({
        workingDesk: false,
        effectiveWorkingCareerRehearsalDoor: "rehearsal",
      }),
    ).toBe(false);
  });

  it("resolves architecture scope when architecture id is present", () => {
    expect(
      resolveWorkingCareerRehearsalDoorScope({ architectureId: "architecture-003" }),
    ).toEqual({
      kind: "architecture",
      architectureId: "architecture-003",
    });
    expect(workingCareerRehearsalArchitectureStorageKey("architecture-003")).toContain(
      "architecture-003",
    );
  });
});
