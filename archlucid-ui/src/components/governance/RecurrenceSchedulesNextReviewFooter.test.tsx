import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  RecurrenceSchedulesNextReviewFooter,
  recurrenceSchedulesNextReviewFooterHref,
} from "./RecurrenceSchedulesNextReviewFooter";

describe("RecurrenceSchedulesNextReviewFooter", () => {
  it("builds the next review recurrence schedules href from run id", () => {
    expect(recurrenceSchedulesNextReviewFooterHref("run-2")).toBe(
      "/governance/recurrence-schedules?runId=run-2",
    );
  });

  it("renders next review recurrence schedules link", () => {
    render(
      <RecurrenceSchedulesNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/recurrence-schedules?runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("recurrence-schedules-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("recurrence-schedules-next-review-action")).toHaveAttribute(
      "href",
      "/governance/recurrence-schedules?runId=run-2",
    );
  });
});
