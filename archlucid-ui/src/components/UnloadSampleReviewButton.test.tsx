import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const refreshMock = vi.fn();
const pathnameMock = vi.fn(() => "/architecture/sponsor-dashboard");

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: (): { push: (path: string) => void; replace: (path: string, options?: { scroll?: boolean }) => void; refresh: () => void } => ({
      push: pushMock,
      replace: replaceMock,
      refresh: refreshMock,
    }),
    usePathname: () => pathnameMock(),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

const showErrorMock = vi.fn();
const showSuccessMock = vi.fn();
const invalidateSponsorMock = vi.fn(async () => undefined);
const invalidateHomeRunsMock = vi.fn(async () => undefined);

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showErrorMock(...args),
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showInfo: vi.fn(),
}));

vi.mock("@/lib/operator/operator-query-invalidation", () => ({
  invalidateOperatorSponsorRoiCaches: () => invalidateSponsorMock(),
  invalidateOperatorHomeRunsCaches: () => invalidateHomeRunsMock(),
}));

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { BUYER_UNLOAD_SAMPLE_WORKSPACE_SUCCESS } from "@/lib/buyer/buyer-polish-copy";
import { UnloadSampleReviewButton } from "./UnloadSampleReviewButton";

describe("UnloadSampleReviewButton", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
    showErrorMock.mockReset();
    showSuccessMock.mockReset();
    invalidateSponsorMock.mockClear();
    invalidateHomeRunsMock.mockClear();
    pathnameMock.mockReturnValue(SPONSOR_DASHBOARD_HREF);
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts to /api/purge-sample and refreshes sponsor dashboard on success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ redirectTo: SPONSOR_DASHBOARD_HREF }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<UnloadSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /unload sample dashboard/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/purge-sample");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => {
      expect(invalidateSponsorMock).toHaveBeenCalledTimes(1);
      expect(invalidateHomeRunsMock).toHaveBeenCalledTimes(1);
      expect(replaceMock).toHaveBeenCalledWith(SPONSOR_DASHBOARD_HREF, { scroll: false });
      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(showSuccessMock).toHaveBeenCalledWith(BUYER_UNLOAD_SAMPLE_WORKSPACE_SUCCESS);
    });
  });
});
