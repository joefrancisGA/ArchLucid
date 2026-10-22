import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingInspectNextFindingEvidenceFooter } from "./FindingInspectNextFindingEvidenceFooter";

describe("FindingInspectNextFindingEvidenceFooter", () => {
  it("links to the next finding evidence trace", () => {
    render(
      <FindingInspectNextFindingEvidenceFooter
        target={{
          findingId: "finding-2",
          title: "Open network path",
          href: "/architecture/reviews/run-1/findings/finding-2/evidence-trace",
        }}
      />,
    );

    expect(screen.getByTestId("finding-inspect-next-finding-evidence-footer")).toBeInTheDocument();
    expect(screen.getByText("Next finding evidence")).toBeInTheDocument();
    expect(screen.getByTestId("finding-inspect-next-finding-evidence-action")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-2/evidence-trace",
    );
    expect(screen.getByRole("link", { name: "Open next evidence trace" })).toBeInTheDocument();
  });
});
