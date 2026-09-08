import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

const getDraftRequest = vi.fn();
const isArchitectureDraftHandoffAcknowledged = vi.fn();

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/lib/api/draft-intake-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/draft-intake-api")>("@/lib/api/draft-intake-api");

  return {
    ...actual,
    getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  };
});

vi.mock("@/lib/api/architecture-runs", () => ({
  getRunSummary: vi.fn().mockResolvedValue({ runId: "run-001", displayName: "Claims intake modernization" }),
}));

vi.mock("@/hooks/use-architecture-draft-autosave", () => ({
  useArchitectureDraftAutosave: vi.fn(),
}));

vi.mock("@/hooks/use-unsaved-changes-guard", () => ({
  useUnsavedChangesGuard: vi.fn(),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: vi.fn(() => []),
}));

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: {
      monthlyBudgetMonitoringActive: true,
      blocksAdditionalLlmExecution: false,
      utcMonth: "2026-08",
      hardCutoffUsdPerUtcMonth: 75,
      effectiveHardCapUsd: 75,
      purchasedCapBumpUsd: 0,
      estimatedUsdPressure: 25,
      assumedNextCallReservationUsd: 0.5,
      hardCapUtilizationFraction: 0.33,
      warnFraction: 0.75,
      remainingBudgetUsd: 50,
    },
    blocksLlmExecution: false,
  }),
}));

vi.mock("@/lib/architecture/architecture-draft-handoff-gate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/architecture/architecture-draft-handoff-gate")>(
    "@/lib/architecture/architecture-draft-handoff-gate",
  );

  return {
    ...actual,
    isArchitectureDraftHandoffAcknowledged: (...args: unknown[]) => isArchitectureDraftHandoffAcknowledged(...args),
    trackArchitectureDraftPostSpawnEdit: vi.fn(),
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <span data-testid="page-contextual-help-stub" />,
}));

vi.mock("@/components/draft-intake/DraftIntakeReasoningPanel", () => ({
  DraftIntakeReasoningPanel: () => null,
}));

vi.mock("@/components/architecture/ArchitectureDraftAiRefinePanel", () => ({
  ArchitectureDraftAiRefinePanel: () => null,
}));

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import {
  ARCHITECTURE_DRAFT_AUTOSAVE_ACCOUNT_SENTENCE,
  ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE,
  ARCHITECTURE_DRAFT_DETAIL_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_DRAFT_DETAIL_PRIMARY_CONTENT_ID,
  ARCHITECTURE_DRAFT_DETAIL_SKIP_LINK_LABEL,
  ARCHITECTURE_DRAFT_DETAIL_SKIP_TARGET_ID,
} from "@/lib/architecture/architecture-draft-detail-page-copy";
import {
  ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE,
  ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE,
  ARCHITECTURES_DRAFT_SOURCES,
} from "@/lib/architectures-draft-evidence-copy";
import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";

const loadedDraft = {
  draftId: "arch-001",
  tenantId: "tenant",
  workspaceId: "ws",
  projectId: "default",
  status: "Draft",
  document: {
    freeTextIntent: "Claims intake modernization",
    businessOutcome: "Reduce manual routing",
    systemName: "Claims intake",
    actorSet: { actors: [] },
    workflowIntent: "create-architecture",
  },
  createdUtc: "2026-01-01T00:00:00.000Z",
  updatedUtc: "2026-01-02T00:00:00.000Z",
} as const;

beforeEach(() => {
  getDraftRequest.mockReset();
  isArchitectureDraftHandoffAcknowledged.mockReset();
  isArchitectureDraftHandoffAcknowledged.mockReturnValue(false);
  getDraftRequest.mockResolvedValue(loadedDraft);
  vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
    saveState: "idle",
    lastSavedUtc: null,
    conflictMessage: null,
    saveDraft: vi.fn(),
    reloadDraft: vi.fn(),
    acceptServerBaseline: vi.fn(),
    syncServerUpdatedUtc: vi.fn(),
    hasPersistedDraft: true,
  });
});

describe("ArchitectureDraftWorkspace buyer-polished detail shell (ARR)", () => {
  it("renders skip link, first-viewport band, orientation above draft form, and Sources links", async () => {
    render(<ArchitectureDraftWorkspace draftId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace-title")).toHaveTextContent("Claims intake");
    });

    expect(screen.getByRole("link", { name: ARCHITECTURE_DRAFT_DETAIL_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_DRAFT_DETAIL_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("architecture-draft-detail-primary-content")).toHaveAttribute(
      "id",
      ARCHITECTURE_DRAFT_DETAIL_PRIMARY_CONTENT_ID,
    );
    expect(screen.queryByTestId("page-contextual-help-stub")).not.toBeInTheDocument();

    const workspaceLead = screen.getByTestId("architecture-draft-workspace-lead");
    expect(workspaceLead.textContent).toContain(ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE);
    expect(workspaceLead.textContent).toMatch(/Required before review:.*Complete the system name/i);
    expect(workspaceLead.textContent).toContain(ARCHITECTURE_DRAFT_AUTOSAVE_ACCOUNT_SENTENCE);
    expect(screen.getByTestId("architecture-draft-detail-claim-discipline").textContent).toContain(
      ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: ARCHITECTURES_DRAFT_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Diligence artifact index" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId("architecture-draft-detail-primary-content");
    const firstViewport = screen.getByTestId(ARCHITECTURE_DRAFT_DETAIL_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("architecture-draft-detail-orientation-top");
    const startReviewChecklist = screen.getByTestId("architecture-draft-start-review-setup-progress");
    const sourcesSection = screen.getByTestId("architecture-draft-detail-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(startReviewChecklist);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(startReviewChecklist) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ARCHITECTURES_DRAFT_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
