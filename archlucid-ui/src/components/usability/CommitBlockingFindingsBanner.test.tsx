import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommitBlockingFindingsBanner } from "@/components/usability/CommitBlockingFindingsBanner";

describe("CommitBlockingFindingsBanner", () => {
  it("renders nothing when the run id is blank", () => {
    const { container } = render(<CommitBlockingFindingsBanner runId="  " reason="Blocked." />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the server-derived blocked reason", () => {
    render(
      <CommitBlockingFindingsBanner
        runId="run-abc"
        reason="Finding coverage is commit-blocking. Failed engines: Security, Cost."
      />,
    );

    expect(
      screen.getByText("Finding coverage is commit-blocking. Failed engines: Security, Cost."),
    ).toBeInTheDocument();
  });

  it("falls back to a generic sentence when no reason is supplied", () => {
    render(<CommitBlockingFindingsBanner runId="run-abc" reason={null} />);

    expect(
      screen.getByText("One or more required finding checks did not complete for this review."),
    ).toBeInTheDocument();
  });

  it("links to the review findings tab rather than a per-finding route", () => {
    render(<CommitBlockingFindingsBanner runId="run abc" reason="Blocked." />);

    const link = screen.getByTestId("commit-blocking-findings-open-findings");

    expect(link).toHaveAttribute("href", "/architecture/reviews/run%20abc?reviewTab=findings");
  });

  it("never invents a blocking finding count", () => {
    render(<CommitBlockingFindingsBanner runId="run-abc" reason="Blocked." />);

    expect(screen.queryByText(/blocking finding/)).toBeNull();
  });
});
