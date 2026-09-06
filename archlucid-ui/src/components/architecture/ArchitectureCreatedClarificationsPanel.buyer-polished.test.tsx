import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoEnvMock.buyerPolished,
  };
});

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
}));

import { ArchitectureCreatedClarificationsPanel } from "@/components/architecture/ArchitectureCreatedClarificationsPanel";
import { buildArchitectureCreatedHomeModel } from "@/lib/architecture/architecture-created-home-model";
import {
  ARCHITECTURE_CREATED_CLARIFICATIONS_BUYER_EMPTY_SUCCESS_BODY,
  ARCHITECTURE_CREATED_CLARIFICATIONS_BUYER_START_HERE_HELPER,
  ARCHITECTURE_CREATED_CLARIFICATIONS_PAGE_LEAD,
} from "@/lib/architecture/architecture-created-clarifications-sources";
import { ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_TARGET_ID } from "@/lib/architecture/architecture-created-clarifications-page-copy";

function buildModel() {
  return buildArchitectureCreatedHomeModel({
    runId: "run-abc",
    architectureName: "Claims platform",
    architectureOverview:
      "A structured workflow platform for analysts with Entra ID authentication, auditable evidence trails, and exportable architecture reviews for enterprise tenants.",
    businessOutcome: "Reduce manual triage time and improve auditability for operations teams.",
    peopleAndSystems: [{ label: "Claims analyst", kind: "Human" }],
    ownerLabel: null,
    lastUpdatedLabel: "Jul 31, 2026",
    workspaceStatus: { label: "Draft", kind: "draft", statusTagKind: "neutral" },
    assessmentInProgress: false,
    hasArtifacts: true,
    correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-abc",
    gapAssertion: { businessOutcome: false, peopleAndSystems: false },
    gapSourceCapturedAtUtc: null,
  });
}

describe("ArchitectureCreatedClarificationsPanel buyer-polished shell (REC)", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
  });

  it("renders first-viewport intro, hides operator chrome, and omits inline Sources strip", () => {
    render(
      <ArchitectureCreatedClarificationsPanel
        model={buildModel()}
        sourceText="## Sponsor report\nStable platform overview with enough detail for assessment."
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        dismissedClarificationGapIds={new Set()}
        onDismissClarificationGap={vi.fn()}
        onNavigateTab={vi.fn()}
      />,
    );

    expect(screen.getByTestId(ARCHITECTURE_CREATED_CLARIFICATIONS_SKIP_TARGET_ID)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-clarifications-intro")).toHaveTextContent(
      ARCHITECTURE_CREATED_CLARIFICATIONS_PAGE_LEAD,
    );
    expect(screen.getByTestId("architecture-clarifications-buyer-start-here-helper")).toHaveTextContent(
      ARCHITECTURE_CREATED_CLARIFICATIONS_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText(/Unresolved clarifications reduce assessment confidence/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-clarifications-sources")).not.toBeInTheDocument();
    expect(screen.queryByText(/Confidence impact/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Continue clarifying/i })).not.toBeInTheDocument();
  });

  it("uses buyer empty-success copy and hides follow-on CTAs", () => {
    render(
      <ArchitectureCreatedClarificationsPanel
        model={buildModel()}
        sourceText="## Sponsor report\nStable platform overview with enough detail for assessment."
        userAssertions={null}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-abc"
        dismissedClarificationGapIds={new Set()}
        onDismissClarificationGap={vi.fn()}
        onNavigateTab={vi.fn()}
      />,
    );

    expect(screen.getByTestId("architecture-clarifications-empty-success")).toHaveTextContent(
      ARCHITECTURE_CREATED_CLARIFICATIONS_BUYER_EMPTY_SUCCESS_BODY,
    );
    expect(screen.queryByRole("link", { name: "Review diagram" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review findings" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View assessment progress" })).not.toBeInTheDocument();
  });

  it("hides gap-row operator actions in buyer-polished shell", () => {
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

    expect(screen.queryByRole("link", { name: /Answer · Guided questions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Not applicable/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open clarifications" })).toBeInTheDocument();
  });
});
