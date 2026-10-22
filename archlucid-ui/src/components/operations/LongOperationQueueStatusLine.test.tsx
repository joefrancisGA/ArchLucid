import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LongOperationQueueStatusLine } from "@/components/operations/LongOperationQueueStatusLine";

describe("LongOperationQueueStatusLine", () => {
  it("renders a bold queue status label with the stage value", () => {
    render(<LongOperationQueueStatusLine stageLabel="Queued" testId="queue-status-line" />);

    const line = screen.getByTestId("queue-status-line");
    expect(line).toHaveTextContent("Queue status: Queued");
    expect(line.querySelector("span")).toHaveClass("font-semibold");
    expect(line.querySelector("span")).toHaveTextContent("Queue status:");
  });

  it("appends elapsed duration after the first 10s refresh", () => {
    render(
      <LongOperationQueueStatusLine stageLabel="Queued" elapsedMs={12_000} testId="queue-status-line" />,
    );

    expect(screen.getByTestId("queue-status-line")).toHaveTextContent("Queue status: Queued (12s)");
  });
});
