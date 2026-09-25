import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useWorkspaceModeMock = vi.fn();
const useArchitectureIdentityQueryMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => useWorkspaceModeMock(),
}));

vi.mock("@/hooks/use-architecture-identity-query", () => ({
  useArchitectureIdentityQuery: (...args: unknown[]) => useArchitectureIdentityQueryMock(...args),
}));

vi.mock("@/components/architecture/WorkingInstrumentDocumentTitle", () => ({
  WorkingInstrumentDocumentTitle: () => null,
}));

vi.mock("@/app/(operator)/insights/ask-review-questions/_sections/AskPageContent", () => ({
  AskPageContent: () => <div data-testid="ask-page-content" />,
}));

vi.mock("@/app/(operator)/insights/ask-review-questions/_sections/AskSuspenseFallback", () => ({
  AskSuspenseFallback: () => <div data-testid="ask-suspense-fallback" />,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/CompareForm", () => ({
  CompareForm: () => <div data-testid="compare-form" />,
}));

vi.mock("@/app/(operator)/insights/compare-two-reviews/_sections/CompareSuspenseFallback", () => ({
  CompareSuspenseFallback: () => <div data-testid="compare-suspense-fallback" />,
}));

vi.mock("@/components/architecture/ArchitectureNestedToolScopeSeed", () => ({
  ArchitectureNestedToolScopeSeed: () => null,
}));

vi.mock("@/components/usability/OperateUnlockOnCompareVisit", () => ({
  OperateUnlockOnCompareVisit: () => null,
}));

vi.mock("@/app/(operator)/governance/findings/governance-findings-deferred-chunks", () => ({
  GovernanceFindingsQueueClientDeferred: () => <div data-testid="findings-queue" />,
}));

vi.mock("@/app/(operator)/governance/findings/GovernanceFindingsQueueSkeleton", () => ({
  GovernanceFindingsQueueSkeleton: () => <div data-testid="findings-skeleton" />,
}));

vi.mock("@/app/(operator)/insights/evidence-graph/_sections/GraphPageContent", () => ({
  GraphPageContent: () => <div data-testid="graph-page-content" />,
}));

vi.mock("@/app/(operator)/insights/evidence-graph/_sections/GraphSuspenseFallback", () => ({
  GraphSuspenseFallback: () => <div data-testid="graph-suspense-fallback" />,
}));

vi.mock("@/app/(operator)/insights/impact-preview/_sections/EvolutionReviewPageClient", () => ({
  EvolutionReviewPageClient: () => <div data-testid="impact-preview-client" />,
}));

vi.mock("@/app/(operator)/insights/impact-preview/_sections/ImpactPreviewSetupSkeleton", () => ({
  ImpactPreviewSetupSkeleton: () => <div data-testid="impact-preview-skeleton" />,
}));

vi.mock("@/app/(operator)/insights/search-review-evidence/_sections/SearchPageClient", () => ({
  SearchPageClient: () => <div data-testid="search-page-client" />,
}));

vi.mock("@/components/architecture/ArchitectureDraftWorkspace", () => ({
  ArchitectureDraftWorkspace: () => <div data-testid="architecture-draft-workspace" />,
}));

vi.mock("@/app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard", () => ({
  FirstPilotIntakeWizard: () => <div data-testid="first-pilot-intake-wizard" />,
}));

vi.mock("@/app/(operator)/architecture/reviews/new/SocraticIntakeWizard", () => ({
  SocraticIntakeWizard: () => <div data-testid="socratic-intake-wizard" />,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/architecture/architectures/customer-intake/ask",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

import { ArchitectureNestedAskPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/ask/ArchitectureNestedAskPageClient";
import { ArchitectureNestedComparePageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/compare/ArchitectureNestedComparePageClient";
import { ArchitectureNestedDraftPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/drafts/[draftId]/ArchitectureNestedDraftPageClient";
import { ArchitectureNestedFindingsPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/findings/ArchitectureNestedFindingsPageClient";
import { ArchitectureNestedGraphPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/graph/ArchitectureNestedGraphPageClient";
import { ArchitectureNestedImpactPreviewPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/impact-preview/ArchitectureNestedImpactPreviewPageClient";
import { ArchitectureNestedSearchPageClient } from "@/app/(operator)/architecture/architectures/[architectureId]/search/ArchitectureNestedSearchPageClient";
import { NestedArchitectureStartReviewBody } from "@/app/(operator)/architecture/architectures/[architectureId]/reviews/new/NestedArchitectureStartReviewBody";
import {
  workingArchitectureNestedClaimDisciplineTestId,
  workingArchitectureNestedSkipLinkLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";

function mockWorkingNestedChrome() {
  useWorkspaceModeMock.mockReturnValue({ isWorkingMode: true });
  useArchitectureIdentityQueryMock.mockReturnValue({
    data: {
      architectureId: "customer-intake",
      displayName: "Customer intake",
      archivedUtc: null,
      currentDraftId: null,
      latestReviewId: null,
      drafts: [],
    },
    isLoading: false,
    isError: false,
    blockedReason: null,
  });
}

function expectWorkingNestedShell(toolLabel: Parameters<typeof workingArchitectureNestedSkipLinkLabel>[0]) {
  expect(screen.getByTestId("working-architecture-nested-tool-shell")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: workingArchitectureNestedSkipLinkLabel(toolLabel) })).toBeInTheDocument();
  expect(screen.getByTestId(workingArchitectureNestedClaimDisciplineTestId(toolLabel))).toBeInTheDocument();
  expect(screen.getByTestId("working-architecture-nested-tool-context-strip")).toBeInTheDocument();
}

describe("architecture nested page clients working mode", () => {
  it.each([
    ["AAS Ask", () => render(<ArchitectureNestedAskPageClient architectureId="customer-intake" />), "Ask" as const],
    [
      "ARO Compare",
      () => render(<ArchitectureNestedComparePageClient architectureId="customer-intake" />),
      "Compare" as const,
    ],
    [
      "RAR Draft",
      () =>
        render(
          <ArchitectureNestedDraftPageClient architectureId="customer-intake" draftId="draft-1" />,
        ),
      "Draft" as const,
    ],
    [
      "ARI Findings",
      () => render(<ArchitectureNestedFindingsPageClient architectureId="customer-intake" />),
      "Findings" as const,
    ],
    [
      "AGR Graph",
      () => render(<ArchitectureNestedGraphPageClient architectureId="customer-intake" />),
      "Graph" as const,
    ],
    [
      "ARM Impact preview",
      () =>
        render(
          <ArchitectureNestedImpactPreviewPageClient
            architectureId="customer-intake"
            loaded={{ mode: "demo" }}
          />,
        ),
      "Impact preview" as const,
    ],
    [
      "ASE Search",
      () => render(<ArchitectureNestedSearchPageClient architectureId="customer-intake" />),
      "Search" as const,
    ],
    [
      "RAX Start review",
      () => render(<NestedArchitectureStartReviewBody architectureId="customer-intake" />),
      "Start review" as const,
    ],
  ])("%s mounts Working nested shell chrome", (_label, renderClient, toolLabel) => {
    mockWorkingNestedChrome();
    renderClient();
    expectWorkingNestedShell(toolLabel);
  });
});
