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

  it("shows attribution and strips markdown from structured sections", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle="Claims intake platform"
        architectureText={"## Sponsor report\n\n**Governed** intake for PHI.\n| Scope | Value |\n|---|---|\n| A | B |"}
        evidenceCount={4}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(
      screen.getByText("Extracted from the submitted architecture document — not an ArchLucid assessment"),
    ).toBeInTheDocument();
    expect(screen.getByText("Governed intake for PHI.")).toBeInTheDocument();
    expect(screen.queryByText("**")).not.toBeInTheDocument();
    expect(screen.queryByText("|")).not.toBeInTheDocument();
  });

  it("shows distinct architecture name when provided", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle="Claims intake platform"
        architectureText={"## Sponsor report\n\nGoverned intake for PHI."}
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

  it("keeps separate lines of a multi-line submission distinct", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText={"**Domain** Payments\nTenant isolation is enforced\nEvidence is attached"}
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.getByText("Domain Payments")).toBeInTheDocument();
    expect(screen.getByText("Tenant isolation is enforced")).toBeInTheDocument();
    expect(screen.getByText("Evidence is attached")).toBeInTheDocument();
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
