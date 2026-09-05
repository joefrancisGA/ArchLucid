import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/created/run-abc",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

import { ArchitectureCreatedOverviewPanel } from "@/components/architecture/ArchitectureCreatedOverviewPanel";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import { ARCHITECTURE_CREATED_OVERVIEW_SOURCES } from "@/lib/architecture/architecture-created-overview-sources";
import { ARCHITECTURE_STRUCTURED_RETRY_LABEL } from "@/lib/architecture/architecture-structured-content-copy";

function buildModel(overrides: Parameters<typeof buildArchitectureCreatedHomeModel>[0] = {}) {
  return buildArchitectureCreatedHomeModel({
    runId: "run-abc",
    architectureName: "",
    architectureOverview: "Short.",
    businessOutcome: "",
    peopleAndSystems: [],
    ownerLabel: null,
    lastUpdatedLabel: "Jul 31, 2026",
    workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
    assessmentInProgress: false,
    hasArtifacts: false,
    correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
    gapAssertion: { businessOutcome: true, peopleAndSystems: true },
    gapSourceCapturedAtUtc: null,
    ...overrides,
  });
}

describe("ArchitectureCreatedOverviewPanel", () => {
  it("links Continue clarifying to run-scoped correction href (TB-1862)", () => {
    const model = buildModel();

    render(
      <ArchitectureCreatedOverviewPanel
        model={model}
        sourceText=""
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    const continueLink = screen.getByRole("link", { name: /continue clarifying/i });

    expect(continueLink.getAttribute("href")).toContain("rerun=run-abc");
    expect(continueLink.getAttribute("href")).toContain("path=guided-intake");
  });

  it("renders overview heading, provenance legend, and sources orientation strip", () => {
    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText=""
        userAssertions={null}
        correctionHref={null}
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Architecture overview" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-overview-provenance-legend")).toHaveTextContent(/Asserted/i);
    expect(screen.getByTestId("architecture-overview-provenance-legend")).toHaveTextContent(/Inferred/i);
    expect(screen.getByTestId("architecture-overview-sources")).toBeInTheDocument();
    expect(screen.getByText(/not a finalized review record export trail/i)).toBeInTheDocument();

    for (const link of ARCHITECTURE_CREATED_OVERVIEW_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toBeInTheDocument();
    }
  });

  it("shows structuring failure notice instead of pending empty copy on partial parse failure", () => {
    const malformedSource = `[actor:Inferred] billing|Machine|svc
[inferred:0.8] region=eastus
{"system":"orphan-json"}
alpha|beta|gamma|delta|epsilon|zeta`;

    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText={malformedSource}
        userAssertions={null}
        correctionHref={null}
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    expect(screen.getByTestId("architecture-structured-parse-failure")).toBeInTheDocument();
    expect(
      screen.queryByText(/sections will appear as ArchLucid extracts more from your brief/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-overview-empty-state")).not.toBeInTheDocument();
  });

  it("shows bordered empty state with continue clarifying and submitted brief disclosure", () => {
    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText=""
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted brief body</div>}
      />,
    );

    expect(screen.getByTestId("architecture-overview-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /no structured overview yet/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue clarifying/i })).toHaveAttribute(
      "href",
      "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
    );

    fireEvent.click(screen.getByRole("button", { name: /open the submitted brief/i }));

    const briefDetails = screen.getByTestId("architecture-overview-submitted-brief");

    expect(briefDetails).toHaveAttribute("open");
    expect(within(briefDetails).getByText("Submitted brief body")).toBeInTheDocument();
  });

  it("demotes Continue clarifying when Do this next owns the page primary", () => {
    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText=""
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted brief body</div>}
        pagePrimaryOwnedElsewhere
      />,
    );

    expect(screen.getByTestId("architecture-overview-continue-clarifying").className).toContain("border-neutral-300");
  });

  it("exposes a single clarification control that navigates to the Clarifications tab", () => {
    const onNavigateTab = vi.fn();
    const source = `## Sponsor report
Governed claims intake platform.`;

    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText={source}
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        openClarificationGapCount={2}
        onNavigateTab={onNavigateTab}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    expect(screen.queryByRole("heading", { name: /open clarifications/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /open clarifications/i })).toHaveLength(1);
    expect(screen.queryByTestId("architecture-overview-empty-state")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open clarifications/i }));

    expect(onNavigateTab).toHaveBeenCalledWith("clarifications");
  });

  it("default-opens risks and constraints when structured content is present", () => {
    const source = `## Sponsor report
Governed claims intake.

## Business outcome
Reduce manual triage.

## Risks
Vendor dependency on identity provider.

## Constraints
Must retain audit trail for seven years.`;

    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText={source}
        userAssertions={null}
        correctionHref={null}
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    expect(screen.getByTestId("architecture-structured-section-risks")).toHaveAttribute("open");
    expect(screen.getByTestId("architecture-structured-section-constraints")).toHaveAttribute("open");
    expect(screen.getByTestId("architecture-structured-section-sponsor-report")).toHaveAttribute("open");
  });

  it("retries structuring from the failure notice", () => {
    const malformedSource = `[actor:Inferred] billing|Machine|svc
[inferred:0.8] region=eastus
{"system":"orphan-json"}
alpha|beta|gamma|delta|epsilon|zeta`;

    render(
      <ArchitectureCreatedOverviewPanel
        model={buildModel()}
        sourceText={malformedSource}
        userAssertions={null}
        correctionHref={null}
        openClarificationGapCount={0}
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_STRUCTURED_RETRY_LABEL }));

    expect(screen.getByTestId("architecture-structured-parse-failure")).toBeInTheDocument();
  });
});
