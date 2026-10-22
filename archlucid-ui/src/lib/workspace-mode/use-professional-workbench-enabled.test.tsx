import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProfessionalWorkbenchEnabled } from "@/lib/workspace-mode/use-professional-workbench-enabled";
import {
  PROFESSIONAL_WORKBENCH_STORAGE_KEY,
  persistProfessionalWorkbenchEnabled,
  syncProfessionalWorkbenchFromServer,
} from "@/lib/workspace-mode/professional-workbench-preference";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode/workspace-mode-preference";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: false,
  mounted: true,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/lib/workspace-mode/professional-workbench-preference", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/workspace-mode/professional-workbench-preference")>();

  return {
    ...actual,
    syncProfessionalWorkbenchFromServer: vi.fn(async () => null),
    persistProfessionalWorkbenchEnabled: vi.fn(async () => true),
  };
});

describe("useProfessionalWorkbenchEnabled", () => {
  beforeEach(() => {
    window.localStorage.clear();
    workspaceModeMock.isWorkingMode = false;
    workspaceModeMock.mounted = true;
    vi.mocked(syncProfessionalWorkbenchFromServer).mockResolvedValue(null);
    vi.mocked(persistProfessionalWorkbenchEnabled).mockResolvedValue(true);
  });

  it("enables workbench on first render in Working mode with no stored preference", () => {
    workspaceModeMock.isWorkingMode = true;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");

    const { result } = renderHook(() => useProfessionalWorkbenchEnabled());

    expect(result.current.enabled).toBe(true);
    expect(result.current.mounted).toBe(true);
  });

  it("keeps workbench off in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "guided");

    const { result } = renderHook(() => useProfessionalWorkbenchEnabled());

    expect(result.current.enabled).toBe(false);
  });

  it("respects explicit Tab-only storage in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "0");

    const { result } = renderHook(() => useProfessionalWorkbenchEnabled());

    expect(result.current.enabled).toBe(false);
  });

  it("reads Working mode from storage before workspace mode provider mounts", () => {
    workspaceModeMock.isWorkingMode = false;
    workspaceModeMock.mounted = false;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");

    const { result } = renderHook(() => useProfessionalWorkbenchEnabled());

    expect(result.current.enabled).toBe(true);
  });

  it("persists Tab-only choice through the user-preferences client", async () => {
    workspaceModeMock.isWorkingMode = true;

    const { result } = renderHook(() => useProfessionalWorkbenchEnabled());

    act(() => {
      result.current.setEnabled(false);
    });

    await waitFor(() => {
      expect(persistProfessionalWorkbenchEnabled).toHaveBeenCalledWith(false);
    });
    expect(window.localStorage.getItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY)).toBe("0");
    expect(result.current.enabled).toBe(false);
  });

  it("applies explicit server preference when sync completes", async () => {
    workspaceModeMock.isWorkingMode = true;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");
    vi.mocked(syncProfessionalWorkbenchFromServer).mockResolvedValue(false);

    const { result } = renderHook(() => useProfessionalWorkbenchEnabled());

    await waitFor(() => {
      expect(result.current.enabled).toBe(false);
    });
  });
});
