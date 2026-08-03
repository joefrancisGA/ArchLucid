import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExecutivePageHeader } from "./ExecutivePageHeader";

describe("ExecutivePageHeader", () => {
  it("renders eyebrow, title, and lead with canonical heading levels", () => {
    render(
      <ExecutivePageHeader
        eyebrow="Executive view"
        title="Architecture risk reviews"
        lead="Open a finalized review to see prioritized findings."
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Architecture risk reviews" })).toBeInTheDocument();
    expect(screen.getByText("Executive view")).toBeInTheDocument();
    expect(screen.getByText("Open a finalized review to see prioritized findings.")).toBeInTheDocument();
  });
});
