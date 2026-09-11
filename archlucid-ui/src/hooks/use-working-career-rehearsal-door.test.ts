import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY } from "@/lib/governance/working-career-rehearsal-door";

const workspaceModeMock = vi.hoisted(() => ({
  mode: "working" as "guided" | "working",
}));

const getUserPreferencesMock = vi.hoisted(() => vi.fn());
const setUserWorkingCareerRehearsalDoorMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.mode,
    mounted: true,
    accountSyncState: "synced",
    isWorkingMode: workspaceModeMock.mode === "working",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: (...args: unknown[]) => getUserPreferencesMock(...args),
  setUserWorkingCareerRehearsalDoor: (...args: unknown[]) =>
    setUserWorkingCareerRehearsalDoorMock(...args),
}));

describe("useWorkingCareerRehearsalDoor", () => {
  beforeEach(() => {
    window.localStorage.clear();
    workspaceModeMock.mode = "working";
    getUserPreferencesMock.mockReset();
    setUserWorkingCareerRehearsalDoorMock.mockReset();
    setUserWorkingCareerRehearsalDoorMock.mockResolvedValue(undefined);
    getUserPreferencesMock.mockResolvedValue({
      workingCareerRehearsalDoor: "career",
      workingCareerRehearsalDoorIsExplicit: false,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("overlays an explicit server door over empty localStorage", async () => {
    getUserPreferencesMock.mockResolvedValue({
      workingCareerRehearsalDoor: "rehearsal",
      workingCareerRehearsalDoorIsExplicit: true,
    });

    const { useWorkingCareerRehearsalDoor } = await import("@/hooks/use-working-career-rehearsal-door");
    const { result } = renderHook(() => useWorkingCareerRehearsalDoor());

    await waitFor(() => {
      expect(result.current.door).toBe("rehearsal");
    });
    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY)).toBe("rehearsal");
  });

  it("keeps localStorage interrupt when GET is not explicit", async () => {
    window.localStorage.setItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY, "rehearsal");

    const { useWorkingCareerRehearsalDoor } = await import("@/hooks/use-working-career-rehearsal-door");
    const { result } = renderHook(() => useWorkingCareerRehearsalDoor());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });
    expect(result.current.door).toBe("rehearsal");
    await waitFor(() => {
      expect(setUserWorkingCareerRehearsalDoorMock).toHaveBeenCalledWith("rehearsal");
    });
  });

  it("PUTs the door on Working setDoor and writes interrupt cache", async () => {
    const { useWorkingCareerRehearsalDoor } = await import("@/hooks/use-working-career-rehearsal-door");
    const { result } = renderHook(() => useWorkingCareerRehearsalDoor());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setDoor("rehearsal");
    });

    expect(result.current.door).toBe("rehearsal");
    expect(window.localStorage.getItem(WORKING_CAREER_REHEARSAL_TENANT_STORAGE_KEY)).toBe("rehearsal");
    await waitFor(() => {
      expect(setUserWorkingCareerRehearsalDoorMock).toHaveBeenCalledWith("rehearsal");
    });
  });

  it("does not PUT the door on Guided", async () => {
    workspaceModeMock.mode = "guided";

    const { useWorkingCareerRehearsalDoor } = await import("@/hooks/use-working-career-rehearsal-door");
    const { result } = renderHook(() => useWorkingCareerRehearsalDoor());

    await waitFor(() => {
      expect(result.current.mounted).toBe(true);
    });

    act(() => {
      result.current.setDoor("rehearsal");
    });

    expect(result.current.door).toBe("rehearsal");
    expect(getUserPreferencesMock).not.toHaveBeenCalled();
    expect(setUserWorkingCareerRehearsalDoorMock).not.toHaveBeenCalled();
  });
});
