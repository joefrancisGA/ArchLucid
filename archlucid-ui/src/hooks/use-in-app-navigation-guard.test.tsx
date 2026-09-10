import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type TestRouter = {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
};

const { mockPathname, mockSearchParams, testRouter } = vi.hoisted(() => {
  const router: TestRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  };

  return {
    mockPathname: vi.fn(() => "/architecture/reviews/new"),
    mockSearchParams: vi.fn(() => new URLSearchParams()),
    testRouter: router,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => testRouter,
  usePathname: () => mockPathname(),
  useSearchParams: () => mockSearchParams(),
}));

import { useInAppNavigationGuard } from "./use-in-app-navigation-guard";

describe("useInAppNavigationGuard (LW-076 / LW-079)", () => {
  let underlyingPush: ReturnType<typeof vi.fn>;
  let underlyingReplace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    underlyingPush = vi.fn();
    underlyingReplace = vi.fn();
    testRouter.push = underlyingPush;
    testRouter.replace = underlyingReplace;
    testRouter.back = vi.fn();
    mockPathname.mockReturnValue("/architecture/reviews/new");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    window.history.pushState({}, "", "/architecture/reviews/new");
  });

  it("allows router.push when the guard is disabled", () => {
    const { result } = renderHook(() => useInAppNavigationGuard({ when: false }));

    act(() => {
      testRouter.push("/architecture/reviews");
    });

    expect(underlyingPush).toHaveBeenCalledWith("/architecture/reviews");
    expect(result.current.dialogOpen).toBe(false);
  });

  it("blocks router.push to another operator route until the operator confirms leave", () => {
    const { result } = renderHook(() => useInAppNavigationGuard({ when: true }));

    act(() => {
      testRouter.push("/architecture/reviews");
    });

    expect(result.current.dialogOpen).toBe(true);
    expect(underlyingPush).not.toHaveBeenCalled();

    act(() => {
      result.current.confirmLeave();
    });

    expect(result.current.dialogOpen).toBe(false);
  });

  it("allows navGuardOpen URL sync via router.replace when dirty", () => {
    const { result } = renderHook(() => useInAppNavigationGuard({ when: true }));

    act(() => {
      testRouter.replace("/architecture/reviews/new?navGuardOpen=1");
    });

    expect(underlyingReplace.mock.calls[0]?.[0]).toBe("/architecture/reviews/new?navGuardOpen=1");
    expect(result.current.dialogOpen).toBe(false);
  });

  it("allows same-pathname router.replace for in-page query sync when dirty", () => {
    const { result } = renderHook(() => useInAppNavigationGuard({ when: true }));

    act(() => {
      testRouter.replace("/architecture/reviews/new?intakeStep=1");
    });

    expect(underlyingReplace.mock.calls[0]?.[0]).toBe("/architecture/reviews/new?intakeStep=1");
    expect(result.current.dialogOpen).toBe(false);
  });
});
