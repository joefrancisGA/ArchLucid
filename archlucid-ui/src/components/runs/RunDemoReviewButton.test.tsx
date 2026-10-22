import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: (): { push: (path: string) => void; refresh: () => void } => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

const showErrorMock = vi.fn();

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showErrorMock(...args),
  showSuccess: vi.fn(),
  showInfo: vi.fn(),
}));

import { RunDemoReviewButton } from "@/components/runs/RunDemoReviewButton";

describe("RunDemoReviewButton", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    showErrorMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders a text-only primary button without decorative icons", () => {
    render(<RunDemoReviewButton />);

    const button = screen.getByRole("button", { name: /run demo review/i });

    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeNull();
    expect(button.className).toContain("al-primary-action-bg");
  });

  it("posts to /api/run-demo-review and navigates to redirectTo on success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ redirectTo: "/architecture/reviews/demo-run-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<RunDemoReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /run demo review/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/run-demo-review");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/architecture/reviews/demo-run-1");
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
