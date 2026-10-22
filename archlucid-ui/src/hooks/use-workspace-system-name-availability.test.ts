import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useWorkspaceSystemNameAvailability,
  WORKSPACE_SYSTEM_NAME_AVAILABILITY_DEBOUNCE_MS,
} from "@/hooks/use-workspace-system-name-availability";
import { fetchWorkspaceSystemNameAvailability } from "@/lib/api/workspace-system-name-availability-api";

vi.mock("@/lib/api/workspace-system-name-availability-api", () => ({
  fetchWorkspaceSystemNameAvailability: vi.fn(),
}));

describe("useWorkspaceSystemNameAvailability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchWorkspaceSystemNameAvailability).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats empty names as available without calling the API", () => {
    const { result } = renderHook(() =>
      useWorkspaceSystemNameAvailability({
        systemName: "   ",
      }),
    );

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.blocksSubmit).toBe(false);
    expect(fetchWorkspaceSystemNameAvailability).not.toHaveBeenCalled();
  });

  it("blocks submit when the API reports a workspace conflict", async () => {
    vi.mocked(fetchWorkspaceSystemNameAvailability).mockResolvedValue({
      systemName: "ArchLucid",
      isAvailable: false,
      conflictMessage: "A review named 'ArchLucid' already exists in this workspace.",
    });

    const { result } = renderHook(() =>
      useWorkspaceSystemNameAvailability({
        systemName: "ArchLucid",
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WORKSPACE_SYSTEM_NAME_AVAILABILITY_DEBOUNCE_MS);
    });

    expect(result.current.blocksSubmit).toBe(true);
    expect(result.current.conflictMessage).toContain("ArchLucid");
    expect(fetchWorkspaceSystemNameAvailability).toHaveBeenCalledWith(
      expect.objectContaining({ systemName: "ArchLucid", occupancyKind: "review" }),
    );
  });

  it("does not block submit when the API reports the name is available", async () => {
    vi.mocked(fetchWorkspaceSystemNameAvailability).mockResolvedValue({
      systemName: "Unique System",
      isAvailable: true,
    });

    const { result } = renderHook(() =>
      useWorkspaceSystemNameAvailability({
        systemName: "Unique System",
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(WORKSPACE_SYSTEM_NAME_AVAILABILITY_DEBOUNCE_MS);
    });

    expect(result.current.validationReady).toBe(true);
    expect(result.current.blocksSubmit).toBe(false);
    expect(result.current.isAvailable).toBe(true);
  });
});
