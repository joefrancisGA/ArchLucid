import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";

describe("RunDetailArchitectureSummaryCard", () => {
  it("shows submitted-text omission lead when intake flag is set without architecture text", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText={null}
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.getByText("Submitted architecture text was not stored.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Architecture text summary was not stored. Evidence items listed above were stored on this review.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-view-submitted-architecture")).toBeInTheDocument();
  });

  it("omits a negative empty state when submitted architecture is not recorded", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText={null}
        evidenceCount={0}
        userAssertions={null}
        hasSubmittedArchitecture={false}
        onNavigateTab={() => undefined}
      />,
    );

    expect(
      screen.queryByText("No architecture description was submitted with this review."),
    ).not.toBeInTheDocument();
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

  it("labels zero evidence items without implying uploaded files", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle="Claims intake platform"
        architectureText={"## Sponsor report\n\nGoverned intake for PHI."}
        evidenceCount={0}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(
      screen.getByText("No submitted source documents are listed for this review."),
    ).toBeInTheDocument();
    expect(screen.queryByText("0", { selector: "dd" })).not.toBeInTheDocument();
  });

  it("always shows the four structured summary rows with omission copy when sections are absent", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText={"## Sponsor report\n\n"}
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.getByText("Purpose", { selector: "dt" })).toBeInTheDocument();
    expect(screen.getAllByText("Sponsor report").length).toBeGreaterThan(0);
    expect(screen.getByText("Business outcome was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Scope was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Major systems were not stored.")).toBeInTheDocument();
  });

  it("labels inferred section provenance distinctly from asserted", () => {
    render(
      <RunDetailArchitectureSummaryCard
        architectureTitle={null}
        architectureText={"## Business outcome\n\nReduce triage time."}
        evidenceCount={1}
        userAssertions={null}
        hasSubmittedArchitecture
        onNavigateTab={() => undefined}
      />,
    );

    expect(screen.getByText(/Inferred from submitted text/)).toBeInTheDocument();
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
