import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedClarificationsPanel } from "@/components/architecture/ArchitectureCreatedClarificationsPanel";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";

describe("ArchitectureCreatedClarificationsPanel", () => {
  it("uses run-scoped guided questions href and omits intake wording", () => {
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
      correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
      gapAssertion: { businessOutcome: true, peopleAndSystems: true },
      gapSourceCapturedAtUtc: null,
    });

    render(
      <ArchitectureCreatedClarificationsPanel
        model={model}
        sourceText=""
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        dismissedClarificationGapIds={new Set()}
        onDismissClarificationGap={vi.fn()}
        onNavigateTab={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Clarifications" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-clarifications-sources")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-workspace-clarifications-panel")).not.toHaveTextContent(/intake/i);

    const answerLink = screen.getByRole("link", { name: /Continue clarifying · Guided questions/i });
    expect(answerLink.getAttribute("href")).toContain("rerun=run-abc");
  });

  it("shows structuring failure notice instead of empty-state success copy", () => {
    const model = buildArchitectureCreatedHomeModel({
      runId: "run-abc",
      architectureName: "Platform",
      architectureOverview:
        "A governed workflow platform for analysts with Entra ID authentication, auditable evidence trails, and exportable architecture reviews for enterprise tenants.",
      businessOutcome: "Reduce manual triage time and improve auditability for operations teams.",
      peopleAndSystems: [{ label: "Analyst", kind: "Human" }],
      ownerLabel: null,
      lastUpdatedLabel: "Jul 31, 2026",
      workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
      assessmentInProgress: false,
      hasArtifacts: true,
      correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
      gapAssertion: { businessOutcome: true, peopleAndSystems: true },
      gapSourceCapturedAtUtc: null,
    });
    const malformedSource = `[actor:Inferred] billing|Machine|svc
{"system":"orphan-json"}
alpha|beta|gamma|delta|epsilon|zeta`;

    render(
      <ArchitectureCreatedClarificationsPanel
        model={model}
        sourceText={malformedSource}
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        dismissedClarificationGapIds={new Set()}
        onDismissClarificationGap={vi.fn()}
        onNavigateTab={vi.fn()}
      />,
    );

    expect(screen.getByTestId("architecture-structured-parse-failure")).toBeInTheDocument();
    expect(screen.queryByText("No critical clarification gaps detected from your brief.")).not.toBeInTheDocument();
  });
});
