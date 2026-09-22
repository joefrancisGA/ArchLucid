import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resolveWorkingCareerRehearsalDoorFromServerAndInterrupt,
  syncWorkingCareerRehearsalDoorFromServer,
} from "@/lib/governance/working-career-rehearsal-door-preference";
import {
  WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY,
  writeWorkingCareerRehearsalDoorToStorage,
} from "@/lib/governance/working-career-rehearsal-door";

const getUserPreferencesMock = vi.hoisted(() => vi.fn());
const setUserWorkingCareerRehearsalDoorMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: (...args: unknown[]) => getUserPreferencesMock(...args),
  setUserWorkingCareerRehearsalDoor: (...args: unknown[]) =>
    setUserWorkingCareerRehearsalDoorMock(...args),
}));

describe("resolveWorkingCareerRehearsalDoorFromServerAndInterrupt", () => {
  it("prefers an explicit server door over localStorage interrupt", () => {
    expect(
      resolveWorkingCareerRehearsalDoorFromServerAndInterrupt({
        serverDoor: "career",
        serverIsExplicit: true,
        interruptDoor: "rehearsal",
        implicitDefault: "rehearsal",
      }),
    ).toBe("career");
  });

  it("uses localStorage interrupt when the server row is not explicit", () => {
    expect(
      resolveWorkingCareerRehearsalDoorFromServerAndInterrupt({
        serverDoor: "career",
        serverIsExplicit: false,
        interruptDoor: "rehearsal",
        implicitDefault: "career",
      }),
    ).toBe("rehearsal");
  });

  it("uses the implicit AS-080 default when neither server nor interrupt is explicit", () => {
    expect(
      resolveWorkingCareerRehearsalDoorFromServerAndInterrupt({
        serverDoor: "career",
        serverIsExplicit: false,
        interruptDoor: null,
        implicitDefault: "career",
      }),
    ).toBe("career");
  });
});

describe("syncWorkingCareerRehearsalDoorFromServer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getUserPreferencesMock.mockReset();
    setUserWorkingCareerRehearsalDoorMock.mockReset();
    setUserWorkingCareerRehearsalDoorMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("writes the explicit server door into localStorage interrupt cache", async () => {
    getUserPreferencesMock.mockResolvedValue({
      workingCareerRehearsalDoor: "rehearsal",
      workingCareerRehearsalDoorIsExplicit: true,
    });

    const synced = await syncWorkingCareerRehearsalDoorFromServer({ kind: "tenant" });

    expect(synced).toBe("rehearsal");
    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY)).toBe("rehearsal");
    expect(setUserWorkingCareerRehearsalDoorMock).not.toHaveBeenCalled();
  });

  it("migrates an explicit localStorage interrupt to the server when GET is not explicit", async () => {
    writeWorkingCareerRehearsalDoorToStorage({ kind: "tenant" }, "rehearsal");
    getUserPreferencesMock.mockResolvedValue({
      workingCareerRehearsalDoor: "career",
      workingCareerRehearsalDoorIsExplicit: false,
    });

    const synced = await syncWorkingCareerRehearsalDoorFromServer({ kind: "tenant" });

    expect(synced).toBe("rehearsal");
    expect(setUserWorkingCareerRehearsalDoorMock).toHaveBeenCalledWith("rehearsal");
  });

  it("does not persist the implicit Career default when nothing is stored", async () => {
    getUserPreferencesMock.mockResolvedValue({
      workingCareerRehearsalDoor: "career",
      workingCareerRehearsalDoorIsExplicit: false,
    });

    const synced = await syncWorkingCareerRehearsalDoorFromServer({ kind: "tenant" });

    expect(synced).toBeNull();
    expect(setUserWorkingCareerRehearsalDoorMock).not.toHaveBeenCalled();
  });
});
