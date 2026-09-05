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
});
