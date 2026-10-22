import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecurrenceSchedulesContinueLastViewedRow } from "./RecurrenceSchedulesContinueLastViewedRow";

describe("RecurrenceSchedulesContinueLastViewedRow", () => {
  it("renders continue row for last viewed schedule", () => {
    render(
      <RecurrenceSchedulesContinueLastViewedRow
        target={{ scheduleId: "sched-1", name: "Weekly architecture review" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("recurrence-schedules-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Weekly architecture review")).toBeInTheDocument();
  });
});
