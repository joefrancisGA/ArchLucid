import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDraftRequest = vi.fn();
const isArchitectureDraftHandoffAcknowledged = vi.fn();

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
  ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING,
  ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER,
} from "@/lib/architecture/architecture-draft-detail-page-copy";
import { ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE } from "@/lib/architectures-draft-evidence-copy";
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
    hasPersistedDraft: true,
  });
});

describe("ArchitectureDraftWorkspace buyer-polished detail shell", () => {
  it("renders breadcrumb, buyer subtitle, claim strip, and hides guidance disclosure", async () => {
    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace-title")).toHaveTextContent("Claims intake");
    });

    expect(screen.getByTestId("architecture-draft-detail-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_DRAFT_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURES_DRAFT_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
  });
});
