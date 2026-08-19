import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();
const clearArchitectureCreationDraftId = vi.fn();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    // Keep pending false so only the wall-clock timeout clears the depressed CTA.
    useTransition: () => [false, (callback: () => void) => callback()] as const,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    prefetch,
  }),
  usePathname: () => "/",
}));

vi.mock("@/lib/architecture/architecture-creation-session", () => ({
  clearArchitectureCreationDraftId: () => clearArchitectureCreationDraftId(),
}));

vi.mock("@/components/architecture/ArchitectureDraftWorkspace", () => ({
  ArchitectureDraftWorkspace: () => null,
}));

import {
  CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS,
  useCreateArchitectureNavigation,
} from "./use-create-architecture-navigation";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";

describe("useCreateArchitectureNavigation", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
    assign.mockReset();
    clearArchitectureCreationDraftId.mockReset();
    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/",
      origin: "http://localhost",
      assign,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("opens the draft workspace without pre-creating a server draft", () => {
    const { result } = renderHook(() => useCreateArchitectureNavigation());

    act(() => {
      result.current.navigate();
    });

    expect(clearArchitectureCreationDraftId).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(ARCHITECTURES_NEW_PATH);
    expect(result.current.isNavigating).toBe(true);
  });

  it("releases a depressed CTA after the soft-nav timeout", async () => {
    const { result } = renderHook(() => useCreateArchitectureNavigation());

    act(() => {
      result.current.navigate();
    });

    expect(result.current.isNavigating).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS);
    });

    expect(result.current.isNavigating).toBe(false);
    expect(assign).toHaveBeenCalledWith(ARCHITECTURES_NEW_PATH);
    expect(result.current.error).toBeNull();
  });
});
