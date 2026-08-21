import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailGovernanceCta } from "./RunDetailGovernanceCta";

describe("RunDetailGovernanceCta", () => {
  it("links to governance workflow with run id query param", () => {
    render(<RunDetailGovernanceCta runId="run-123" />);

    expect(screen.getByTestId("run-detail-governance-cta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Submit for resolve outcomes →" })).toHaveAttribute(
      "href",
      "/governance/approval-queue?runId=run-123",
    );
  });

  it("demotes the button to outline when the summary header owns the primary CTA", () => {
    render(<RunDetailGovernanceCta runId="run-123" demoted />);

    expect(screen.getByRole("link", { name: "Submit for resolve outcomes →" })).toHaveClass("border");
  });
});
