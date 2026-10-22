import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AdvisorySchedulesNextReviewFooter,
  advisorySchedulesNextReviewHref,
} from "./AdvisorySchedulesNextReviewFooter";

describe("AdvisorySchedulesNextReviewFooter", () => {
  it("builds the next review advisory schedules href from run id", () => {
    expect(advisorySchedulesNextReviewHref("run-2")).toBe(
      "/governance/advisory-scans?tab=schedules&runId=run-2",
    );
  });

  it("renders next review advisory schedules link", () => {
    render(
      <AdvisorySchedulesNextReviewFooter
        target={{
          runId: "run-2",
          reviewTitle: "Q2 review",
          href: "/governance/advisory-scans?tab=schedules&runId=run-2",
        }}
      />,
    );

    expect(screen.getByTestId("advisory-schedules-next-review-footer")).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedules-next-review-action")).toHaveAttribute(
      "href",
      "/governance/advisory-scans?tab=schedules&runId=run-2",
    );
  });
});
