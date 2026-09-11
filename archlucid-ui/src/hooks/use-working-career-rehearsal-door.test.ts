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

describe("useWorkingCareerRehearsalDoor cross-tab (CG-012)", () => {
  type FanOutChannel = {
    readonly name: string;
    readonly listeners: Set<(event: MessageEvent) => void>;
  };

  let channelsByName: Map<string, Set<FanOutChannel>>;

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
    channelsByName = new Map();

    class FanOutBroadcastChannel {
      readonly listeners = new Set<(event: MessageEvent) => void>();

      constructor(public readonly name: string) {
        const group = channelsByName.get(name) ?? new Set<FanOutChannel>();
        group.add(this);
        channelsByName.set(name, group);
      }

      addEventListener(eventName: string, handler: (event: MessageEvent) => void): void {
        if (eventName === "message") {
          this.listeners.add(handler);
        }
      }

      removeEventListener(eventName: string, handler: (event: MessageEvent) => void): void {
        if (eventName === "message") {
          this.listeners.delete(handler);
        }
      }

      postMessage(data: unknown): void {
        const peers = channelsByName.get(this.name);

        if (peers === undefined) {
          return;
        }

        for (const peer of peers) {
          if (peer === this) {
            continue;
          }

          for (const listener of peer.listeners) {
            listener({ data } as MessageEvent);
          }
        }
      }

      close(): void {
        channelsByName.get(this.name)?.delete(this);
      }
    }

    vi.stubGlobal("BroadcastChannel", FanOutBroadcastChannel);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("second tab sees Rehearsal after the first tab saves without a second PUT", async () => {
    const { useWorkingCareerRehearsalDoor } = await import("@/hooks/use-working-career-rehearsal-door");
    const firstTab = renderHook(() => useWorkingCareerRehearsalDoor());
    const secondTab = renderHook(() => useWorkingCareerRehearsalDoor());

    await waitFor(() => {
      expect(firstTab.result.current.mounted).toBe(true);
      expect(secondTab.result.current.mounted).toBe(true);
    });

    act(() => {
      firstTab.result.current.setDoor("rehearsal");
    });

    await waitFor(() => {
      expect(secondTab.result.current.door).toBe("rehearsal");
    });
    expect(firstTab.result.current.door).toBe("rehearsal");
    await waitFor(() => {
      expect(setUserWorkingCareerRehearsalDoorMock).toHaveBeenCalledTimes(1);
    });
    expect(setUserWorkingCareerRehearsalDoorMock).toHaveBeenCalledWith("rehearsal");
  });

  it("does not steal draft CAS when applying a sibling door", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const hookSource = readFileSync(
      join(process.cwd(), "src/hooks/use-working-career-rehearsal-door.ts"),
      "utf8",
    );

    expect(hookSource).toContain("subscribeWorkingCareerRehearsalDoorBroadcast");
    expect(hookSource).toContain("never draft CAS");
    expect(hookSource).not.toContain("expectedUpdatedUtc");
    expect(hookSource).not.toContain("forceOverwrite");
  });
});
