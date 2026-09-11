import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS,
  LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT,
  NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT,
  readWorkingCareerRehearsalDoorFromStorage,
  resolveDefaultWorkingCareerRehearsalDoor,
  WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY,
} from "@/lib/governance/working-career-rehearsal-door";
import {
  resolveWorkingCareerRehearsalDoorFromServerAndInterrupt,
  syncWorkingCareerRehearsalDoorFromServer,
} from "@/lib/governance/working-career-rehearsal-door-preference";

const REPO_ROOT = join(process.cwd(), "..");

const getUserPreferencesMock = vi.hoisted(() => vi.fn());
const setUserWorkingCareerRehearsalDoorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: (...args: unknown[]) => getUserPreferencesMock(...args),
  setUserWorkingCareerRehearsalDoor: (...args: unknown[]) =>
    setUserWorkingCareerRehearsalDoorMock(...args),
}));

describe("CG-014 new Working tenant Career intent ratchet", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getUserPreferencesMock.mockReset();
    setUserWorkingCareerRehearsalDoorMock.mockReset();
    setUserWorkingCareerRehearsalDoorMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("defaults a first-run Working tenant to Career, not unlabeled Rehearsal", () => {
    expect(NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT).toBe("career");
    expect(resolveDefaultWorkingCareerRehearsalDoor({})).toBe("career");
    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("career");
  });

  it("keeps C# GET Default aligned with the TS first-run Career token", () => {
    const csharp = readFileSync(
      join(REPO_ROOT, "ArchLucid.Contracts/User/WorkingCareerRehearsalDoorValues.cs"),
      "utf8",
    );

    expect(csharp).toMatch(/public const string Career = "career"/);
    expect(csharp).toMatch(/public const string Default = Career/);
    expect(csharp).not.toMatch(/public const string Default = Rehearsal/);
  });

  it("uses implicit GET Career without PUTting on first-run empty storage", async () => {
    getUserPreferencesMock.mockResolvedValue({
      workingCareerRehearsalDoor: "career",
      workingCareerRehearsalDoorIsExplicit: false,
    });

    expect(
      resolveWorkingCareerRehearsalDoorFromServerAndInterrupt({
        serverDoor: "career",
        serverIsExplicit: false,
        interruptDoor: null,
        implicitDefault: NEW_WORKING_TENANT_CAREER_REHEARSAL_DOOR_DEFAULT,
      }),
    ).toBe("career");

    const synced = await syncWorkingCareerRehearsalDoorFromServer({ kind: "tenant" });

    expect(synced).toBeNull();
    expect(setUserWorkingCareerRehearsalDoorMock).not.toHaveBeenCalled();
    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("career");
  });

  it("grandfathers legacy Simulator usage as Rehearsal (banner is CG-015)", () => {
    expect(LEGACY_WORKING_SIMULATOR_REHEARSAL_DOOR_DEFAULT).toBe("rehearsal");
    window.localStorage.setItem(LEGACY_WORKING_DOOR_USAGE_SIGNAL_STORAGE_KEYS[0], "working");

    expect(readWorkingCareerRehearsalDoorFromStorage({ kind: "tenant" })).toBe("rehearsal");
    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_GRANDFATHER_STORAGE_KEY)).toBe("1");
  });

  it("does not flip host AgentExecution:Mode from the door module", () => {
    const doorModule = readFileSync(
      join(REPO_ROOT, "archlucid-ui/src/lib/governance/working-career-rehearsal-door.ts"),
      "utf8",
    );
    const as080 = readFileSync(
      join(
        REPO_ROOT,
        "ArchLucid.Architecture.Tests/ArchitectureSpineAs080NewWorkingTenantsCareerIntentArchitectureTests.cs",
      ),
      "utf8",
    );

    expect(doorModule).not.toContain("AgentExecution:Mode");
    expect(as080).toContain("As080_door_module_does_not_flip_host_agent_execution_mode");
  });
});
