import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureCreatedWorkspace } from "@/components/architecture/ArchitectureCreatedWorkspace";
import {
  ARCHITECTURE_CREATED_GOVERNANCE_BUYER_START_HERE_HELPER,
  ARCHITECTURE_CREATED_GOVERNANCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE,
  ARCHITECTURE_CREATED_GOVERNANCE_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ARCHITECTURE_CREATED_GOVERNANCE_PAGE_LEAD,
  ARCHITECTURE_CREATED_GOVERNANCE_PRIMARY_CONTENT_ID,
  ARCHITECTURE_CREATED_GOVERNANCE_SKIP_LINK_LABEL,
  ARCHITECTURE_CREATED_GOVERNANCE_SKIP_TARGET_ID,
  ARCHITECTURE_CREATED_GOVERNANCE_SOURCES,
  ARCHITECTURE_CREATED_GOVERNANCE_START_HERE_CARD_TITLE,
} from "@/lib/architecture/architecture-created-governance-sources";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

const searchParamsState = {
  value: new URLSearchParams("fromGeneration=1&intent=create-architecture&reviewTab=policies"),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/reviews/run-1",
  useSearchParams: () => searchParamsState.value,
}));

vi.mock("@/components/architecture/ArchitectureDiagramPanel", () => ({
  ArchitectureDiagramPanel: () => <div data-testid="architecture-diagram-panel-mock" />,
}));

const demoEnvMock = vi.hoisted(() => ({
  buyerPolished: true,
  evalChrome: true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => demoEnvMock.evalChrome,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => demoEnvMock.buyerPolished,
  };
});

const baseline = {
  runId: "run-1",
  architectureName: "Claims platform",
  architectureOverview: "A structured workflow platform for analysts with auditable evidence trails.",
  businessOutcome: "Reduce manual triage time.",
  peopleAndSystems: [{ label: "Analyst", kind: "Human" as const }],
  ownerLabel: "owner@example.com",
  lastUpdatedLabel: "Jul 11, 2026",
  workspaceStatus: { label: "Draft", kind: "draft" as const, statusTagKind: "neutral" as const },
  assessmentInProgress: false,
  hasArtifacts: false,
  correctionHref: "/architecture/reviews/new?path=guided-intake&rerun=run-1",
  gapAssertion: { businessOutcome: true, peopleAndSystems: true },
  gapSourceCapturedAtUtc: null,
};

describe("ArchitectureCreatedWorkspace buyer-polished Governance tab (REG)", () => {
  beforeEach(() => {
    demoEnvMock.buyerPolished = true;
    demoEnvMock.evalChrome = true;
    searchParamsState.value = new URLSearchParams(
      "fromGeneration=1&intent=create-architecture&reviewTab=policies",
    );
  });

  it("renders skip link, intro, header claim discipline, sources chrome, and hides vocabulary rail", () => {
    render(
      <ArchitectureCreatedWorkspace
        baseline={baseline}
        architectureSourceText="Generated architecture body"
        canEditDiagram
        findings={[]}
        correctionHref="/architecture/reviews/new?path=guided-intake&rerun=run-1"
        panels={{
          findings: <div data-testid="findings-panel-slot">Findings</div>,
          evidence: <div data-testid="evidence-panel-slot">Evidence</div>,
          governance: <div data-testid="governance-panel-slot">Governance</div>,
          activity: <div data-testid="activity-panel-slot">Activity</div>,
          submittedArchitecture: <div data-testid="submitted-panel-slot">Submitted</div>,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: ARCHITECTURE_CREATED_GOVERNANCE_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_CREATED_GOVERNANCE_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("architecture-created-governance-intro")).toHaveTextContent(
      ARCHITECTURE_CREATED_GOVERNANCE_PAGE_LEAD,
    );
    expect(screen.getByTestId("architecture-created-governance-buyer-start-here-helper")).toHaveTextContent(
      ARCHITECTURE_CREATED_GOVERNANCE_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: ARCHITECTURE_CREATED_GOVERNANCE_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(ARCHITECTURE_CREATED_GOVERNANCE_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      ARCHITECTURE_CREATED_GOVERNANCE_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const governancePanel = screen.getByTestId("architecture-workspace-panel-governance");

    expect(screen.queryByTestId("architecture-created-overflow-menu")).not.toBeInTheDocument();
    expect(within(governancePanel).queryByTestId("package-governance-approval-queue-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-governance-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_CREATED_GOVERNANCE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-created-compact-context-bar")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-created-compact-first-viewport")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(ARCHITECTURE_CREATED_GOVERNANCE_PRIMARY_CONTENT_ID);
    const orientationBottom = within(governancePanel).getByTestId("architecture-governance-orientation-bottom");
    const sourcesSection = screen.getByTestId("architecture-governance-sources");

    expect(governancePanel).toContainElement(primaryContent);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(ARCHITECTURE_CREATED_GOVERNANCE_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
