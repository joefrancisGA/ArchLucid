import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailGovernanceCta } from "./RunDetailGovernanceCta";

describe("RunDetailGovernanceCta", () => {
  it("links to governance workflow with run id query param", () => {
    render(<RunDetailGovernanceCta runId="run-123" />);

    expect(screen.getByTestId("run-detail-governance-cta")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Submit for governance approval →" })).toHaveAttribute(
      "href",
      "/governance?runId=run-123",
    );
  });
});
