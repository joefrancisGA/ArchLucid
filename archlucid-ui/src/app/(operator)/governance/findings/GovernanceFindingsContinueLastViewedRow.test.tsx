import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceFindingsContinueLastViewedRow } from "./GovernanceFindingsContinueLastViewedRow";

describe("GovernanceFindingsContinueLastViewedRow", () => {
  it("renders continue row with open link", () => {
    render(
      <GovernanceFindingsContinueLastViewedRow
        target={{
          findingId: "finding-1",
          title: "Private endpoint gap",
          href: "/architecture/reviews/run-1/findings/finding-1",
        }}
      />,
    );

    expect(screen.getByTestId("governance-findings-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-1",
    );
  });
});
