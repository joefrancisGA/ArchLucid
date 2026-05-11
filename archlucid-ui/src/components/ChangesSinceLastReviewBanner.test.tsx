import { fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { ChangesSinceLastReviewBanner } from "./ChangesSinceLastReviewBanner";

expect.extend(toHaveNoViolations);

describe("ChangesSinceLastReviewBanner", () => {
  it("renders comparison link with baseline and target run ids", () => {
    render(
      <ChangesSinceLastReviewBanner
        priorReviewDateLabel="May 9, 2026"
        priorRunId="prior-run"
        currentRunId="current-run"
        copy={{
          netChangeLine: "+1 new findings, -2 resolved",
          severityShiftLine: "1 new Critical, 2 resolved Medium",
        }}
      />,
    );

    fireEvent.click(screen.getByText(/Compared to your previous review on May 9, 2026/i));

    expect(screen.getByText("+1 new findings, -2 resolved")).toBeInTheDocument();
    expect(screen.getByText("1 new Critical, 2 resolved Medium")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /open full comparison/i });

    expect(link).toHaveAttribute(
      "href",
      "/compare?leftRunId=prior-run&rightRunId=current-run",
    );
  });

  it("has no serious axe violations when expanded", async () => {
    const { container } = render(
      <ChangesSinceLastReviewBanner
        priorReviewDateLabel="Jan 1, 2026"
        priorRunId="left-id"
        currentRunId="right-id"
        copy={{
          netChangeLine: "+3 new findings",
          severityShiftLine: null,
        }}
      />,
    );

    fireEvent.click(screen.getByText(/Compared to your previous review/i));

    expect(await axe(container)).toHaveNoViolations();
  });
});
