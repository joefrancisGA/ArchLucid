import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShellInFlightOperationsAffordance } from "@/components/shell/ShellInFlightOperationsAffordance";
import { cancelOperation } from "@/lib/api/operations-api";
import { buildCancelAbandonInFlightClarity } from "@/lib/operations/cancel-abandon-in-flight-clarity";
import {
  getInFlightOperations,
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";
import { requestOpenShellInFlightOperations } from "@/lib/operations/open-shell-in-flight-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/operations-api", () => ({
  getOperation: vi.fn(async () => ({
    operationId: "run:demo",
    state: "Running",
    stepLabel: "Agents running",
    heartbeatUtc: new Date().toISOString(),
    resultRef: { runId: "demo" },
  })),
  cancelOperation: vi.fn(async () => undefined),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

describe("ShellInFlightOperationsAffordance", () => {
  beforeEach(() => {
    resetInFlightOperationsForTests();
    vi.mocked(cancelOperation).mockReset();
    vi.mocked(cancelOperation).mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetInFlightOperationsForTests();
  });

  it("renders nothing when idle", () => {
    const { container } = render(<ShellInFlightOperationsAffordance />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides the trigger when only terminal operations remain in the hold window", () => {
    trackInFlightOperation({
      operationId: "run:demo",
      title: "Architecture review analysis",
      href: "/architecture/reviews/demo",
      runId: "demo",
      stepLabel: "Agent execution failed",
      state: "Failed",
    });

    const { container } = render(<ShellInFlightOperationsAffordance />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows trigger and aria-live rows for tracked operations", async () => {
    trackInFlightOperation({
      operationId: "run:demo",
      title: "Architecture review analysis",
      href: "/architecture/reviews/demo",
      runId: "demo",
      stepLabel: "Queued",
      state: "Pending",
    });

    render(<ShellInFlightOperationsAffordance />);

    expect(screen.getByTestId("shell-in-flight-operations-trigger")).toHaveTextContent(
      "1 in progress",
    );

    screen.getByTestId("shell-in-flight-operations-trigger").click();

    expect(await screen.findByTestId("shell-in-flight-operations-panel")).toBeInTheDocument();
    const row = screen.getByTestId("shell-in-flight-operation-row");
    expect(row).toHaveAttribute("data-operation-id", "run:demo");
    expect(row.closest("ul")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Architecture review analysis")).toBeInTheDocument();
  });

  it("mounts wait/leave/stop clarity and Cancel without canceling on Open", async () => {
    const clarity = buildCancelAbandonInFlightClarity();

    trackInFlightOperation({
      operationId: "run:demo",
      title: "Architecture review analysis",
      href: "/architecture/reviews/demo",
      runId: "demo",
      stepLabel: "Queued",
      state: "Pending",
    });

    render(<ShellInFlightOperationsAffordance />);
    screen.getByTestId("shell-in-flight-operations-trigger").click();

    expect(await screen.findByTestId("shell-in-flight-cancel-abandon-clarity")).toBeInTheDocument();
    expect(screen.getByText(clarity.panelHeaderOneLiner)).toBeInTheDocument();
    expect(screen.getByTestId("shell-in-flight-operation-cancel")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "/architecture/reviews/demo",
    );

    screen.getByRole("link", { name: "Open" }).click();
    expect(cancelOperation).not.toHaveBeenCalled();
  });

  it("requires confirmation before cancelOperation runs", async () => {
    trackInFlightOperation({
      operationId: "run:demo",
      title: "Architecture review analysis",
      href: "/architecture/reviews/demo",
      runId: "demo",
      stepLabel: "Queued",
      state: "Pending",
    });

    render(<ShellInFlightOperationsAffordance />);
    screen.getByTestId("shell-in-flight-operations-trigger").click();

    const cancelButton = await screen.findByTestId("shell-in-flight-operation-cancel");
    cancelButton.click();

    expect(cancelOperation).not.toHaveBeenCalled();
    expect(await screen.findByText("Stop this in-flight operation?")).toBeInTheDocument();

    (await screen.findByRole("button", { name: "Stop operation" })).click();

    await waitFor(() => {
      expect(cancelOperation).toHaveBeenCalledWith("run:demo");
    });
  });

  it("calls cancelOperation and patches CancelRequested on success", async () => {
    trackInFlightOperation({
      operationId: "run:demo",
      title: "Architecture review analysis",
      href: "/architecture/reviews/demo",
      runId: "demo",
      stepLabel: "Queued",
      state: "Pending",
    });

    render(<ShellInFlightOperationsAffordance />);
    screen.getByTestId("shell-in-flight-operations-trigger").click();

    const cancelButton = await screen.findByTestId("shell-in-flight-operation-cancel");
    cancelButton.click();
    (await screen.findByRole("button", { name: "Stop operation" })).click();

    await waitFor(() => {
      expect(cancelOperation).toHaveBeenCalledWith("run:demo");
    });

    await waitFor(() => {
      const row = getInFlightOperations().find((item) => item.operationId === "run:demo");
      expect(row?.state).toBe("CancelRequested");
      expect(row?.stepLabel).toBe("Cancel requested");
    });
  });

  it("shows an error toast when cancel fails", async () => {
    vi.mocked(cancelOperation).mockRejectedValueOnce(new Error("Conflict"));

    trackInFlightOperation({
      operationId: "run:demo",
      title: "Architecture review analysis",
      href: "/architecture/reviews/demo",
      runId: "demo",
      stepLabel: "Running",
      state: "Running",
    });

    render(<ShellInFlightOperationsAffordance />);
    screen.getByTestId("shell-in-flight-operations-trigger").click();

    const cancelButton = await screen.findByTestId("shell-in-flight-operation-cancel");
    cancelButton.click();
    (await screen.findByRole("button", { name: "Stop operation" })).click();

    await waitFor(() => {
      expect(screen.getByTestId("shell-in-flight-cancel-failure-recovery")).toBeInTheDocument();
    });

    const row = getInFlightOperations().find((item) => item.operationId === "run:demo");
    expect(row?.state).toBe("Running");
  });

  it("opens the list when another surface asks to show in-progress work", async () => {
    trackInFlightOperation({
      operationId: "draft:11111111-1111-1111-1111-111111111111",
      title: "Structured brief suggestions",
      href: "/architecture/architectures/arch-001",
      architectureId: "arch-001",
      retainUntilConsumed: true,
    });

    render(<ShellInFlightOperationsAffordance />);

    expect(screen.queryByTestId("shell-in-flight-operations-panel")).not.toBeInTheDocument();

    act(() => {
      requestOpenShellInFlightOperations();
    });

    expect(await screen.findByTestId("shell-in-flight-operations-panel")).toBeInTheDocument();
    expect(screen.getByTestId("shell-in-flight-operation-row")).toHaveTextContent(
      "Structured brief suggestions",
    );
  });
});
