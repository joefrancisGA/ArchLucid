import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";

describe("RunDetailArchitectureSummaryCard", () => {
  it("omits repeated architecture title and only shows submitted-architecture action when source exists", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText="Claims Intake Modernization"
        evidenceCount={2}
        userAssertions={null}
        hasSubmittedArchitecture={false}
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.queryByText("Architecture", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.getByText("No architecture description was submitted with this review.")).toBeInTheDocument();
    expect(screen.queryByTestId("run-detail-view-submitted-architecture")).not.toBeInTheDocument();
  });

  it("shows distinct architecture name when provided", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle="Claims intake platform"
        architectureText={"## Executive summary\n\nGoverned intake for PHI."}
        evidenceCount={4}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.getByText("Claims intake platform")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-view-submitted-architecture")).toBeInTheDocument();
  });

  it("strips markdown and chunks long single-line submissions in the preview", () => {
    const blob = `**Reviewed** ${"classification ".repeat(80)}`;
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText={blob}
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.queryByText("**")).not.toBeInTheDocument();
    const lines = screen.getAllByText(/Reviewed classification/, { exact: false });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(5);
  });

  it("suppresses architecture title when it duplicates the summary prefix", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle="Claims intake"
        architectureText="Claims intake modernization for PHI."
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.queryByText("Architecture", { selector: "dt" })).not.toBeInTheDocument();
  });
});
