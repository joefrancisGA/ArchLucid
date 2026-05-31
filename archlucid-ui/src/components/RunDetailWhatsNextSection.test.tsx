import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailWhatsNextSection } from "./RunDetailWhatsNextSection";

describe("RunDetailWhatsNextSection", () => {
  it("renders plan, compare, and replay links with the run id", () => {
    const runId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    render(<RunDetailWhatsNextSection runId={runId} />);

    expect(screen.getByTestId("run-detail-whats-next")).toBeInTheDocument();

    const planLink = screen.getByTestId("run-detail-plan-next-review");
    expect(planLink).toHaveAttribute(
      "href",
      `/reviews/new?sourceRunId=${encodeURIComponent(runId)}&mode=followup`,
    );

    const compareLink = screen.getByTestId("run-detail-compare-review");
    expect(compareLink.getAttribute("href")).toContain(runId);

    const replayLink = screen.getByTestId("run-detail-replay-review");
    expect(replayLink).toHaveAttribute("href", `/replay?runId=${encodeURIComponent(runId)}`);
  });
});
