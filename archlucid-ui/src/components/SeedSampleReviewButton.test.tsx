import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const pathnameMock = vi.fn(() => "/architecture/reviews");

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: (): { push: (path: string) => void; refresh: () => void } => ({
      push: pushMock,
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
const invalidateExecutiveMock = vi.fn(async () => undefined);
const invalidateHomeRunsMock = vi.fn(async () => undefined);

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showErrorMock(...args),
  showSuccess: (...args: unknown[]) => showSuccessMock(...args),
  showInfo: vi.fn(),
}));

vi.mock("@/lib/operator-query-invalidation", () => ({
  invalidateOperatorExecutiveRoiCaches: () => invalidateExecutiveMock(),
  invalidateOperatorHomeRunsCaches: () => invalidateHomeRunsMock(),
}));

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS } from "@/lib/buyer-polish-copy";
import { SeedSampleReviewButton } from "./SeedSampleReviewButton";

/**
 * Behavioural coverage for the OS-1 reviews-empty-state CTA. The button MUST call the internal
 * `/api/seed-sample` route, route the user to `redirectTo`, and surface a sonner toast (mocked here) on errors.
 */
describe("SeedSampleReviewButton", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    showErrorMock.mockReset();
    showSuccessMock.mockReset();
    invalidateExecutiveMock.mockClear();
    invalidateHomeRunsMock.mockClear();
    pathnameMock.mockReset();
    pathnameMock.mockReturnValue("/architecture/reviews");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the default seed label", () => {
    render(<SeedSampleReviewButton />);

    const button = screen.getByRole("button", { name: /load sample workspace/i });

    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeNull();
    expect(button.className).toContain("border-neutral-300");
    expect(button.className).not.toContain("al-primary-action-bg");
  });

  it("posts to /api/seed-sample and pushes the redirectTo target on success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ redirectTo: EXECUTIVE_DASHBOARD_HREF }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<SeedSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /load sample workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/seed-sample");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => {
      expect(invalidateExecutiveMock).toHaveBeenCalledTimes(1);
      expect(invalidateHomeRunsMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith(EXECUTIVE_DASHBOARD_HREF);
      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(showSuccessMock).toHaveBeenCalledWith(BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS);
    });
  });

  it("refreshes in place without push when already on the redirect target", async () => {
    pathnameMock.mockReturnValue(EXECUTIVE_DASHBOARD_HREF);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ redirectTo: EXECUTIVE_DASHBOARD_HREF }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<SeedSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /load sample workspace/i }));

    await waitFor(() => {
      expect(pushMock).not.toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(showSuccessMock).toHaveBeenCalledWith(BUYER_SEED_SAMPLE_WORKSPACE_SUCCESS);
    });
  });

  it("falls back to executive dashboard when the response omits a redirectTo", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<SeedSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /load sample workspace/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(EXECUTIVE_DASHBOARD_HREF);
    });
  });

  it("surfaces a toast and stays interactive when the upstream returns a non-success status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ title: "Bad Request", status: 400, detail: "Demo seeding is disabled." }), {
        status: 400,
        headers: { "Content-Type": "application/problem+json" },
      }),
    );

    render(<SeedSampleReviewButton />);

    const trigger = screen.getByRole("button", { name: /load sample workspace/i });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledTimes(1);
    });
    expect(showErrorMock).toHaveBeenCalledWith("Demo seeding is disabled.");
    expect(pushMock).not.toHaveBeenCalled();
    expect(trigger).not.toBeDisabled();
  });

  it("surfaces a toast when fetch rejects (e.g. network failure)", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

    render(<SeedSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /load sample workspace/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith("offline");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
