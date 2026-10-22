import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorPageHeader } from "./ExecutivePageHeader";

describe("SponsorPageHeader", () => {
  it("renders eyebrow, title, and lead with canonical heading levels", () => {
    render(
      <SponsorPageHeader
        eyebrow="Sponsor view"
        title="Architecture risk reviews"
        lead="Open a finalized review to see prioritized findings."
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Architecture risk reviews" })).toBeInTheDocument();
    expect(screen.getByText("Sponsor view")).toBeInTheDocument();
    expect(screen.getByText("Open a finalized review to see prioritized findings.")).toBeInTheDocument();
  });
});
