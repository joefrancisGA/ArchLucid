import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LongOperationWaitNotice } from "@/components/LongOperationWaitNotice";

describe("LongOperationWaitNotice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when inactive", () => {
    const { container } = render(
      <LongOperationWaitNotice active={false} operationLabel="Finalizing architecture review" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows named stage while active and escalates with fake timers", async () => {
    render(
      <LongOperationWaitNotice
        active
        operationLabel="Finalizing architecture review"
        stageLabel="Saving finalized review record"
      />,
    );

    expect(screen.getByText("Saving finalized review record")).toBeInTheDocument();
    expect(screen.getByTestId("long-operation-queue-status")).toHaveTextContent(
      "Queue status: Saving finalized review record",
    );
    expect(screen.getByTestId("long-operation-home-page-status-hint")).toHaveTextContent(/Overview/i);
    expect(screen.getByTestId("long-operation-wait-notice")).toHaveAttribute("aria-live", "polite");

    await act(async () => {
      vi.advanceTimersByTime(10_500);
    });

    expect(screen.getByTestId("long-operation-wait-notice")).toHaveAttribute(
      "data-escalation-level",
      "after10s",
    );

    await act(async () => {
      vi.advanceTimersByTime(50_000);
    });

    expect(screen.getByTestId("long-operation-wait-notice")).toHaveAttribute(
      "data-escalation-level",
      "timeoutHint",
    );
    expect(screen.getByRole("link", { name: "Reviews" })).toBeInTheDocument();
  });
});
