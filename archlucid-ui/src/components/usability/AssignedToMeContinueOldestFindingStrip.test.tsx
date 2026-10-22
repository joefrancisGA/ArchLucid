import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssignedToMeContinueOldestFindingStrip } from "./AssignedToMeContinueOldestFindingStrip";

describe("AssignedToMeContinueOldestFindingStrip", () => {
  it("links to the oldest assigned finding", () => {
    render(
      <AssignedToMeContinueOldestFindingStrip
        target={{
          findingId: "finding-oldest",
          findingTitle: "PHI boundary gap",
          runId: "run-1",
          agingDays: 12,
        }}
        href="/architecture/reviews/run-1/findings/finding-oldest"
      />,
    );

    expect(screen.getByTestId("assigned-to-me-continue-oldest-finding-strip")).toBeInTheDocument();
    expect(screen.getByTestId("assigned-to-me-continue-oldest-finding-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-oldest",
    );
    expect(screen.getByText(/12 days open/)).toBeInTheDocument();
  });
});
