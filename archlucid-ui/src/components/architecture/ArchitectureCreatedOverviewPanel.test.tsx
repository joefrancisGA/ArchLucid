import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedOverviewPanel } from "@/components/architecture/ArchitectureCreatedOverviewPanel";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture-created-home-model";

describe("ArchitectureCreatedOverviewPanel", () => {
  it("links Continue clarifying to run-scoped correction href (TB-1862)", () => {
    const model = buildArchitectureCreatedHomeModel({
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
    });

    render(
      <ArchitectureCreatedOverviewPanel
        model={model}
        sourceText=""
        userAssertions={null}
        correctionHref="/reviews/new?path=guided-intake&rerun=run-abc"
        onNavigateTab={vi.fn()}
        submittedArchitectureSection={<div>Submitted</div>}
      />,
    );

    const continueLink = screen.getByRole("link", { name: "Continue clarifying" });

    expect(continueLink.getAttribute("href")).toContain("rerun=run-abc");
    expect(continueLink.getAttribute("href")).toContain("path=guided-intake");
  });
});
