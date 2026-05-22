import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: (): { push: (path: string) => void; refresh: () => void } => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

const showErrorMock = vi.fn();

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showErrorMock(...args),
  showSuccess: vi.fn(),
  showInfo: vi.fn(),
}));

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
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the default seed label", () => {
    render(<SeedSampleReviewButton />);

    expect(screen.getByRole("button", { name: /seed a sample review/i })).toBeInTheDocument();
  });

  it("posts to /api/seed-sample and pushes the redirectTo target on success", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ redirectTo: "/reviews" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<SeedSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /seed a sample review/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [calledUrl, init] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/seed-sample");
    expect((init as RequestInit).method).toBe("POST");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/reviews");
    });
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to /reviews when the response omits a redirectTo", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    render(<SeedSampleReviewButton />);

    fireEvent.click(screen.getByRole("button", { name: /seed a sample review/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/reviews");
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

    const trigger = screen.getByRole("button", { name: /seed a sample review/i });
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

    fireEvent.click(screen.getByRole("button", { name: /seed a sample review/i }));

    await waitFor(() => {
      expect(showErrorMock).toHaveBeenCalledWith("offline");
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
