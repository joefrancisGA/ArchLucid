import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewPackageContinueLastRow } from "./ReviewPackageContinueLastRow";

describe("ReviewPackageContinueLastRow", () => {
  it("renders continue row with last-opened metadata and open link", () => {
    render(
      <ReviewPackageContinueLastRow
        target={{
          runId: "run-1",
          label: "Platform review",
          href: "/architecture/reviews/run-1",
          visitedAtUtc: "2026-01-01T12:00:00Z",
        }}
      />,
    );

    expect(screen.getByTestId("review-package-continue-last-row")).toBeInTheDocument();
    expect(screen.getByText("Platform review")).toBeInTheDocument();
    expect(screen.getByText(/last opened/i)).toBeInTheDocument();
    expect(screen.queryByText(/this browser/i)).toBeNull();
    expect(screen.getByTestId("review-package-continue-last-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1",
    );
  });
});
