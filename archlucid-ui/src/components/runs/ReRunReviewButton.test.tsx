import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReRunReviewButton } from "@/components/runs/ReRunReviewButton";
import {
  getInFlightOperations,
  patchInFlightOperation,
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { RE_RUN_REVIEW_PROGRESS_TICK_MS } from "@/lib/re-run-review-wait-copy";

const executeArchitectureRunAsync = vi.fn();
const routerRefresh = vi.fn();
const routerReplace = vi.fn();

vi.mock("@/lib/api", () => ({
  executeArchitectureRunAsync: (...args: unknown[]) => executeArchitectureRunAsync(...args),
}));

vi.mock("@/lib/await-minimum-visible-duration", () => ({
  awaitMinimumVisibleDuration: vi.fn(async () => undefined),
}));

const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh, replace: routerReplace }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => mockSearchParams,
}));

describe("ReRunReviewButton", () => {
  beforeEach(() => {
    resetInFlightOperationsForTests();
    executeArchitectureRunAsync.mockReset();
    routerRefresh.mockReset();
    routerReplace.mockReset();
    mockSearchParams.forEach((_, key) => {
      mockSearchParams.delete(key);
    });
    executeArchitectureRunAsync.mockResolvedValue({ operationId: "run:run-abc", location: null });
  });

  it("syncs the confirm dialog open state to the URL after render", async () => {
    render(<ReRunReviewButton runId="run-abc" />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));

    await waitFor(() => {
      expect(routerReplace).toHaveBeenCalledWith("/architecture/reviews/run-abc?reRunConfirmOpen=1", {
        scroll: false,
      });
    });
  });

  it("opens the confirm dialog when the URL already has reRunConfirmOpen=1", () => {
    mockSearchParams.set("reRunConfirmOpen", "1");

    render(<ReRunReviewButton runId="run-abc" />);

    expect(screen.getByTestId("re-run-review-confirm-dialog")).toBeInTheDocument();
  });

  it("requires confirmation before spending AI budget", async () => {
    render(<ReRunReviewButton runId="run-abc" retryCount={2} />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));

    expect(screen.getByTestId("re-run-review-confirm-dialog")).toBeInTheDocument();
    expect(screen.getByText(/Attempt/)).toHaveTextContent("3");
    expect(screen.getByText(/Metered AI budget will be consumed/)).toBeInTheDocument();
    expect(executeArchitectureRunAsync).not.toHaveBeenCalled();
  });

  it("re-executes the review on the same run id and shows a durable started outcome", async () => {
    render(<ReRunReviewButton runId="run-abc" retryCount={2} />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(executeArchitectureRunAsync).toHaveBeenCalledWith("run-abc");
      expect(routerRefresh).toHaveBeenCalled();
      expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent(
        "Re-run started — attempt 3 · Queued",
      );
      expect(screen.getByTestId("re-run-review-outcome-detail")).toHaveTextContent(
        "Re-running architecture review started",
      );
      expect(screen.getByTestId("re-run-review-button").parentElement?.className).toContain("flex-col");
      expect(screen.getByTestId("re-run-review-outcome").className).toContain("break-words");
    });
  });

  it("updates the running detail when the shell operation advances", async () => {
    render(<ReRunReviewButton runId="run-abc" />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-outcome")).toBeInTheDocument();
    });

    trackInFlightOperation({
      operationId: "run:run-abc",
      title: "Architecture review analysis",
      href: "/architecture/reviews/run-abc",
      runId: "run-abc",
      stepLabel: "Compliance agent running",
      state: "Running",
      heartbeatUtc: new Date().toISOString(),
    });

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent(
        "Re-run started — attempt 1 · Compliance agent running",
      );
      expect(screen.getByTestId("re-run-review-queue-status")).toHaveTextContent(
        "Queue status: Compliance agent running",
      );
      expect(screen.getByTestId("re-run-review-home-page-status-hint")).toHaveTextContent(/Home/i);
    });
  });

  it("shows how long the review has been queued after the first 10s refresh", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<ReRunReviewButton runId="run-abc" />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-queue-status")).toHaveTextContent("Queue status: Queued");
    });

    expect(screen.getByTestId("re-run-review-queue-status")).not.toHaveTextContent("(10s)");

    await act(async () => {
      vi.advanceTimersByTime(RE_RUN_REVIEW_PROGRESS_TICK_MS);
    });

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-queue-status")).toHaveTextContent("Queue status: Queued (10s)");
    });

    vi.useRealTimers();
  });

  it("updates the outcome when the shell operation reaches a terminal state", async () => {
    render(<ReRunReviewButton runId="run-abc" />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-outcome")).toBeInTheDocument();
    });

    const attemptStartedAtMs = getInFlightOperations()[0]?.startedAtMs ?? Date.now();

    patchInFlightOperation("run:run-abc", {
      stepLabel: "Agent execution failed",
      state: "Failed",
      heartbeatUtc: new Date(attemptStartedAtMs + 2_000).toISOString(),
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("archlucid:shell-operation-terminal", {
          detail: { operationId: "run:run-abc", href: "/architecture/reviews/run-abc" },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent("Attempt 1 · failed after");
      expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent("Agent execution failed");
    });
  });

  it("does not flash the previous failed attempt when a stale terminal operation exists", async () => {
    trackInFlightOperation({
      operationId: "run:run-abc",
      title: "Architecture review analysis",
      href: "/architecture/reviews/run-abc",
      runId: "run-abc",
      stepLabel: "Agent execution failed",
      state: "Failed",
      startedAtMs: Date.now() - 251_300_000,
      heartbeatUtc: new Date(Date.now() - 251_300_000).toISOString(),
    });

    render(<ReRunReviewButton runId="run-abc" retryCount={0} />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent(
        "Re-run started — attempt 1 · Queued",
      );
    });

    expect(screen.getByTestId("re-run-review-outcome")).not.toHaveTextContent("failed after");
    expect(screen.getByTestId("re-run-review-outcome-detail")).not.toHaveTextContent("251300s ago");
    expect(getInFlightOperations()[0]?.state).toBe("Pending");
  });

  it("does not apply a stale failed poll heartbeat to the current re-run outcome", async () => {
    render(<ReRunReviewButton runId="run-abc" retryCount={0} />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent(
        "Re-run started — attempt 1 · Queued",
      );
    });

    const attemptStartedAtMs = getInFlightOperations()[0]?.startedAtMs ?? Date.now();

    patchInFlightOperation("run:run-abc", {
      stepLabel: "Agent execution failed",
      state: "Failed",
      heartbeatUtc: new Date(attemptStartedAtMs - 60_000).toISOString(),
    });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("archlucid:shell-operation-terminal", {
          detail: { operationId: "run:run-abc", href: "/architecture/reviews/run-abc" },
        }),
      );
    });

    expect(screen.getByTestId("re-run-review-outcome")).toHaveTextContent(
      "Re-run started — attempt 1 · Queued",
    );
    expect(screen.getByTestId("re-run-review-outcome")).not.toHaveTextContent("failed after");
  });

  it("renders API errors inline without a success outcome", async () => {
    executeArchitectureRunAsync.mockRejectedValueOnce(new Error("Conflict"));

    render(<ReRunReviewButton runId="run-abc" />);

    fireEvent.click(screen.getByTestId("re-run-review-button"));
    fireEvent.click(screen.getByTestId("re-run-review-confirm-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("re-run-review-outcome")).not.toBeInTheDocument();
      expect(screen.getByText("Conflict")).toBeInTheDocument();
    });
  });
});
