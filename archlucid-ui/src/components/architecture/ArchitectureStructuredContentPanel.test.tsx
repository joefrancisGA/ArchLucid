import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureStructuredContentPanel } from "@/components/architecture/ArchitectureStructuredContentPanel";

describe("ArchitectureStructuredContentPanel", () => {
  it("renders structured sections and hides raw source by default", async () => {
    render(
      <ArchitectureStructuredContentPanel
        sourceText={`## Sponsor report
Governed claims intake.

## Risks
- Partner outage`}
        userAssertions={{
          architectureName: "Claims",
          architectureOverview: "User overview",
          businessOutcome: "Faster triage",
          peopleAndSystems: [],
        }}
        correctionHref="/architecture/reviews/new?path=guided-intake"
        runId="run-1"
      />,
    );

    expect(screen.getByTestId("architecture-structured-section-sponsor-report")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-structured-section-risks")).toBeInTheDocument();
    expect(screen.getByText("Partner outage")).toBeInTheDocument();
    expect(screen.getAllByTestId("architecture-structured-narrative")[0]).toHaveTextContent("Governed claims intake");
    expect(screen.getByTestId("architecture-structured-source")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-structured-source")).not.toHaveAttribute("open");
  });

  it("shows parse-failure actions for malformed model output", () => {
    render(
      <ArchitectureStructuredContentPanel
        sourceText={`[inferred:0.2] foo=bar
alpha|beta|gamma|delta|epsilon|zeta|eta`}
        userAssertions={null}
        correctionHref={null}
        runId="run-2"
      />,
    );

    expect(screen.getByTestId("architecture-structured-parse-failure")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry structuring" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Report issue" })).toHaveAttribute(
      "href",
      "/administration/support?topic=architecture-structuring&runId=run-2",
    );

    fireEvent.click(screen.getByRole("button", { name: "Retry structuring" }));
    expect(screen.getByTestId("architecture-structured-parse-failure")).toBeInTheDocument();
  });

  it("reveals generated source behind a secondary action", () => {
    render(
      <ArchitectureStructuredContentPanel
        sourceText="## Scope\nPrivate networking only."
        userAssertions={null}
        correctionHref={null}
        runId={null}
      />,
    );

    const sourceDisclosure = screen.getByTestId("architecture-structured-source");
    fireEvent.click(screen.getByText("View generated source"));
    expect(sourceDisclosure).toHaveTextContent("Private networking only.");
  });

  it("escapes script tags in rendered markdown output", () => {
    render(
      <ArchitectureStructuredContentPanel
        sourceText={`## Assumptions
<script>alert('xss')</script>`}
        userAssertions={null}
        correctionHref={null}
        runId={null}
      />,
    );

    expect(document.querySelector("script")).toBeNull();
    expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
  });
});
