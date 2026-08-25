import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunsListContinueLastViewedRow } from "./RunsListContinueLastViewedRow";

describe("RunsListContinueLastViewedRow", () => {
  it("renders continue row with open link", () => {
    render(
      <RunsListContinueLastViewedRow
        run={{
          runId: "run-1",
          projectId: "project-1",
          title: "Platform review",
          createdUtc: "2026-01-01T00:00:00Z",
          status: "Committed",
          hasGoldenManifest: true,
        } as never}
      />,
    );

    expect(screen.getByTestId("runs-list-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("runs-list-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1",
    );
  });
});
