import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const prefetch = vi.fn();
const initializeArchitectureCreation = vi.fn();

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

vi.mock("@/lib/architecture-creation-init", () => ({
  initializeArchitectureCreation: () => initializeArchitectureCreation(),
}));

vi.mock("@/components/architecture/ArchitectureCreationBootstrap", () => ({
  ArchitectureCreationBootstrap: () => null,
}));

vi.mock("@/components/architecture/ArchitectureDraftWorkspace", () => ({
  ArchitectureDraftWorkspace: () => null,
}));

import {
  CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS,
  useCreateArchitectureNavigation,
} from "./use-create-architecture-navigation";

describe("useCreateArchitectureNavigation", () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    push.mockReset();
    prefetch.mockReset();
    assign.mockReset();
    initializeArchitectureCreation.mockReset();
    initializeArchitectureCreation.mockResolvedValue({ draftId: "draft-1" });
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

  it("releases a depressed CTA after the soft-nav timeout", async () => {
    const { result } = renderHook(() => useCreateArchitectureNavigation());

    act(() => {
      result.current.navigate();
    });

    expect(result.current.isNavigating).toBe(true);
    expect(push).toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CREATE_ARCHITECTURE_NAVIGATION_TIMEOUT_MS);
    });

    expect(result.current.isNavigating).toBe(false);
    expect(assign).toHaveBeenCalledWith("/architectures/new");
    expect(result.current.error).toBeNull();
  });
});
