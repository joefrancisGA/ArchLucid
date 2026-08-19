import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailSubmittedArchitectureSection } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSubmittedArchitectureSection";

const markdownBrief = `## Sponsor report

Governed claims intake.

## Risks

| Risk | Severity |
| --- | --- |
| Partner outage | High |`;

describe("RunDetailSubmittedArchitectureSection narrative rendering", () => {
  it("renders markdown in the legacy submitted-brief path", () => {
    render(
      <RunDetailSubmittedArchitectureSection
        architectureText={markdownBrief}
        canEditSource={false}
        editHref={null}
        useStructuredPresentation={false}
      />,
    );

    const preview = screen.getByTestId("submitted-architecture-preview");

    expect(within(preview).getByRole("heading", { level: 2, name: "Sponsor report" })).toBeInTheDocument();
    expect(within(preview).getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("## Sponsor report")).toBeNull();
  });
});
