import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/architecture/ArchitectureNarrativeMarkdownView", () => ({
  ArchitectureNarrativeMarkdownView: ({ markdown }: { markdown: string }) => (
    <div data-testid="architecture-narrative-markdown">{markdown}</div>
  ),
}));

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

  it("suppresses repeated architecture title and caps long single-line summaries", () => {
    const repeatedTitle = "**Reviewed** tenant migration overview";
    const longBody = `${repeatedTitle} ${"detail ".repeat(200)}`;

    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={repeatedTitle}
        architectureText={longBody}
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.queryByText("Architecture", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.getByTestId("run-detail-architecture-summary-preview")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-narrative-markdown").textContent).not.toContain("**");
  });
});
