import { beforeEach, describe, expect, it } from "vitest";

import {
  parseWorkingCareerRehearsalDoorId,
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT,
  LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS,
  NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT,
  readWorkingCareerRehearsalDoorFromStorage,
  resolveDefaultWorkingCareerRehearsalDoor,
  resolveWorkingCareerRehearsalDoorScope,
  shouldSuppressReadyToFinalizeForWorkingRehearsalDoor,
  tryReadExplicitWorkingCareerRehearsalDoorFromStorage,
  WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY,
  WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY,
  workingCareerRehearsalArchitectureStorageKey,
  writeWorkingCareerRehearsalDoorToStorage,
} from "@/lib/governance/working-career-rehearsal-door";

describe("working-career-rehearsal-door", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to Career for first-run Working tenants (AS-080)", () => {
    expect(NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT).toBe("career");
    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("career");
  });

  it("keeps suppression fallback on rehearsal when door context is unknown (AS-079)", () => {
    expect(DEFAULT_WORKING_CAREER_REHEARSAL_DOOR).toBe(LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT);
    expect(DEFAULT_WORKING_CAREER_REHEARSAL_DOOR).toBe("rehearsal");
  });

  it("grandfathers rehearsal for legacy Working usage signals without explicit door preference", () => {
    window.localStorage.setItem(LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS[0], "working");

    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("rehearsal");
    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY)).toBe("1");
  });

  it("resolveDefaultWorkingCareerRehearsalDoor honors grandfather inputs", () => {
    expect(
      resolveDefaultWorkingCareerRehearsalDoor({
        hasGrandfatherRehearsalMarker: true,
      }),
    ).toBe("rehearsal");
    expect(
      resolveDefaultWorkingCareerRehearsalDoor({
        hasLegacyWorkingUsageSignals: true,
      }),
    ).toBe("rehearsal");
    expect(resolveDefaultWorkingCareerRehearsalDoor({})).toBe("career");
  });

  it("honors explicit tenant preference over grandfather default", () => {
    window.localStorage.setItem(LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS[0], "working");
    writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, "career");

    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("career");
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

  it("tryReadExplicit returns null when only the AS-080 implicit default applies", () => {
    expect(tryReadExplicitWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBeNull();
  });

  it("tryReadExplicit returns the stored tenant door without inventing a default", () => {
    writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, "rehearsal");

    expect(tryReadExplicitWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("rehearsal");
  });

  it("parseWorkingCareerRehearsalDoorId accepts Record and Practice aliases (ADR 0097)", () => {
    expect(parseWorkingCareerRehearsalDoorId("record")).toBe("career");
    expect(parseWorkingCareerRehearsalDoorId("Record")).toBe("career");
    expect(parseWorkingCareerRehearsalDoorId("practice")).toBe("rehearsal");
    expect(parseWorkingCareerRehearsalDoorId("Practice")).toBe("rehearsal");
    expect(parseWorkingCareerRehearsalDoorId("career")).toBe("career");
    expect(parseWorkingCareerRehearsalDoorId("rehearsal")).toBe("rehearsal");
  });
});
