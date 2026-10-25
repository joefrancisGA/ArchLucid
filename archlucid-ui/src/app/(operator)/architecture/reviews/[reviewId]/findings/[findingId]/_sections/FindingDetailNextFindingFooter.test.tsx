import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingDetailNextFindingFooter } from "./FindingDetailNextFindingFooter";

describe("FindingDetailNextFindingFooter", () => {
  it("links to the next finding in the review", () => {
    render(
      <FindingDetailNextFindingFooter
        target={{
          findingId: "finding-2",
          title: "Open network path",
          href: "/architecture/reviews/run-1/findings/finding-2",
        }}
      />,
    );

    expect(screen.getByTestId("finding-detail-next-finding-footer")).toBeInTheDocument();
    expect(screen.getByTestId("finding-detail-next-finding-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-2",
    );
  });

  it("does not treat the title omission sentence as a finding name", () => {
    render(
      <FindingDetailNextFindingFooter
        target={{
          findingId: "finding-2",
          title: "Finding title was not stored",
          href: "/architecture/reviews/run-1/findings/finding-2",
        }}
      />,
    );

    expect(screen.getByText("The next finding's title was not stored.")).toBeInTheDocument();
  });
});
