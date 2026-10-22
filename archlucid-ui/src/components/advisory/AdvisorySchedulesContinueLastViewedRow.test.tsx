import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisorySchedulesContinueLastViewedRow } from "./AdvisorySchedulesContinueLastViewedRow";

describe("AdvisorySchedulesContinueLastViewedRow", () => {
  it("renders continue row for last viewed schedule", () => {
    render(
      <AdvisorySchedulesContinueLastViewedRow
        target={{ scheduleId: "sched-1", name: "Weekly advisory scan" }}
        onOpen={() => undefined}
      />,
    );

    expect(screen.getByTestId("advisory-schedules-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-continue-last-viewed-open")).toBeInTheDocument();
    expect(screen.getByText("Weekly advisory scan")).toBeInTheDocument();
  });
});
