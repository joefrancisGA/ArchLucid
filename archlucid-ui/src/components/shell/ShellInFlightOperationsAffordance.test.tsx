import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShellInFlightOperationsAffordance } from "@/components/shell/ShellInFlightOperationsAffordance";
import {
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";

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
}));

describe("ShellInFlightOperationsAffordance", () => {
  beforeEach(() => {
    resetInFlightOperationsForTests();
  });

  afterEach(() => {
    resetInFlightOperationsForTests();
  });

  it("renders nothing when idle", () => {
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
});
