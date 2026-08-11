import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDraftRequest = vi.fn();
const getRunSummary = vi.fn();
const saveDraft = vi.fn();
const reloadDraft = vi.fn();
const acknowledgeArchitectureDraftHandoff = vi.fn();
const isArchitectureDraftHandoffAcknowledged = vi.fn();

vi.mock("@/lib/api/draft-intake-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/draft-intake-api")>("@/lib/api/draft-intake-api");

  return {
    ...actual,
    getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  };
});

vi.mock("@/lib/api/architecture-runs", () => ({
  getRunSummary: (...args: unknown[]) => getRunSummary(...args),
}));

vi.mock("@/hooks/use-architecture-draft-autosave", () => ({
  useArchitectureDraftAutosave: vi.fn(() => ({
    saveState: "idle",
    lastSavedUtc: null,
    conflictMessage: null,
    saveDraft,
    reloadDraft,
    hasPersistedDraft: true,
  })),
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

vi.mock("@/components/draft-intake/DraftIntakeReasoningPanel", () => ({
  DraftIntakeReasoningPanel: () => <div data-testid="draft-intake-reasoning-stub">Reasoning stub</div>,
}));

vi.mock("@/components/architecture/ArchitectureDraftAiRefinePanel", () => ({
  ArchitectureDraftAiRefinePanel: () => (
    <div data-testid="architecture-draft-ai-refine-stub">Closed-loop refine stub</div>
  ),
}));

vi.mock("@/lib/architecture-draft-handoff-gate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/architecture-draft-handoff-gate")>(
    "@/lib/architecture-draft-handoff-gate",
  );

  return {
    ...actual,
    acknowledgeArchitectureDraftHandoff: (...args: unknown[]) => acknowledgeArchitectureDraftHandoff(...args),
    isArchitectureDraftHandoffAcknowledged: (...args: unknown[]) => isArchitectureDraftHandoffAcknowledged(...args),
    trackArchitectureDraftPostSpawnEdit: vi.fn(),
  };
});

import { ArchitectureDraftWorkspace } from "./ArchitectureDraftWorkspace";
import { ARCHITECTURE_DRAFT_WORKSPACE_BACK_TO_LIST_LABEL, ARCHITECTURE_DRAFT_WORKSPACE_LEAD, ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE, ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE, ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE, ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD } from "@/lib/create-vs-review-intake-copy";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture-draft-guidance-dismiss";
import { ARCHITECTURES_LIST_PATH, ARCHITECTURE_NEW_DRAFT_SEGMENT } from "@/lib/architecture-routes";
import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";

const spawnedDraft = {
  draftId: "arch-001",
  tenantId: "tenant",
  workspaceId: "ws",
  projectId: "default",
  status: "RunSpawned",
  document: {
    freeTextIntent: "Claims intake modernization",
    businessOutcome: "Reduce manual routing",
    systemName: "Claims intake",
    actorSet: { actors: [] },
    workflowIntent: "create-architecture",
  },
  spawnedRunId: "run-001",
  createdUtc: "2026-01-01T00:00:00.000Z",
  updatedUtc: "2026-01-02T00:00:00.000Z",
} as const;

beforeEach(() => {
  window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
  getDraftRequest.mockReset();
  getRunSummary.mockReset();
  saveDraft.mockReset();
  reloadDraft.mockReset();
  acknowledgeArchitectureDraftHandoff.mockReset();
  isArchitectureDraftHandoffAcknowledged.mockReturnValue(false);
  getDraftRequest.mockResolvedValue(spawnedDraft);
  getRunSummary.mockResolvedValue({
    runId: "run-001",
    displayName: "Claims intake modernization",
  });
  vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
    saveState: "idle",
    lastSavedUtc: null,
    conflictMessage: null,
    saveDraft,
    reloadDraft,
    hasPersistedDraft: true,
  });
});

describe("ArchitectureDraftWorkspace", () => {
  it("opens the empty workspace immediately on /new without fetching a draft", async () => {
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "idle",
      lastSavedUtc: null,
      conflictMessage: null,
      saveDraft,
      reloadDraft,
      hasPersistedDraft: false,
    });

    render(<ArchitectureDraftWorkspace architectureId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />);

    expect(getDraftRequest).not.toHaveBeenCalled();
    expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-creation-new-draft-section-title")).toHaveTextContent(
      ARCHITECTURE_CREATION_NEW_DRAFT_SECTION_TITLE,
    );
    expect(screen.getByTestId("architecture-draft-workspace-lead")).toHaveTextContent(
      ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
    );

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-no-drafts-guidance")).toHaveTextContent(
        ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
      );
    });

    expect(screen.queryByTestId("architecture-draft-autosave-reassurance")).not.toBeInTheDocument();
  });

  it("shows browser-local resume drafts on /new when registry entries exist (TB-1459)", async () => {
    vi.mocked(useArchitectureDraftRegistryEntries).mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Claims intake",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-07-12T23:42:05.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-07-12T23:42:05.000Z",
      },
    ]);

    render(<ArchitectureDraftWorkspace architectureId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-resume-drafts")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-creation-no-drafts-guidance")).toBeNull();
  });

  it("uses resume-first workspace lead on /new when registry entries exist (TB-1462)", async () => {
    vi.mocked(useArchitectureDraftRegistryEntries).mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Claims intake",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-07-12T23:42:05.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-07-12T23:42:05.000Z",
      },
    ]);

    render(<ArchitectureDraftWorkspace architectureId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace-lead")).toHaveTextContent(
        ARCHITECTURE_CREATION_RESUME_FIRST_WORKSPACE_LEAD,
      );
    });
  });

  it("renders an H1 workspace title on edit routes (TB-1451)", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace-title")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { level: 1, name: "Claims intake" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-creation-new-draft-section-title")).not.toBeInTheDocument();
  });

  it("shows a skeleton and list wayfinding while loading an existing draft (TB-1453)", async () => {
    let resolveDraft: (value: typeof spawnedDraft) => void = () => {};
    getDraftRequest.mockReturnValue(
      new Promise((resolve) => {
        resolveDraft = resolve;
      }),
    );

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    expect(screen.getByTestId("architecture-draft-workspace-loading")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-workspace-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByText(/Loading architecture draft/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: ARCHITECTURE_DRAFT_WORKSPACE_BACK_TO_LIST_LABEL })).toHaveAttribute(
      "href",
      ARCHITECTURES_LIST_PATH,
    );

    resolveDraft({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
    });
  });

  it("keeps back-to-list wayfinding on loaded edit routes (TB-1453)", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: ARCHITECTURE_DRAFT_WORKSPACE_BACK_TO_LIST_LABEL })).toHaveAttribute(
      "href",
      ARCHITECTURES_LIST_PATH,
    );
  });

  it("shows drafting-first workspace lead on load (TB-747)", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace-lead")).toHaveTextContent(
        ARCHITECTURE_DRAFT_WORKSPACE_LEAD,
      );
    });

    expect(screen.getByTestId("draft-intake-advanced-section")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-ai-budget-notice")).toHaveTextContent(
      "Architecture reasoning uses AI budget.",
    );
    expect(screen.getByTestId("architecture-draft-pre-execute-cost")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-pre-execute-cost-message")).toHaveTextContent(
      /AI allotment|architecture package/i,
    );
    expect(screen.getByTestId("architecture-draft-ai-refine-stub")).toBeInTheDocument();
    expect(screen.getByTestId("draft-intake-reasoning-stub")).toBeInTheDocument();
  });

  it("stacks at most two intro teaching blocks above the form card (TB-1454)", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
    });

    const introTeachingTestIds = [
      "architecture-draft-workspace-lead",
      "architecture-draft-guidance-disclosure",
      "architecture-draft-alternatives-hint",
    ] as const;

    const visibleIntroBlocks = introTeachingTestIds.filter((testId) => screen.queryByTestId(testId) !== null);

    expect(visibleIntroBlocks).toHaveLength(2);
    expect(screen.queryByTestId("architecture-draft-alternatives-hint")).not.toBeInTheDocument();
  });

  it("hides AI refinement while the post-spawn handoff lock is active", async () => {
    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-handoff-banner")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("draft-intake-advanced-section")).not.toBeInTheDocument();
  });

  it("locks the editor and promotes the linked review when a draft already spawned a review", async () => {
    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-handoff-banner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-draft-workspace-status-tag")).toHaveTextContent("Ready for review");
    expect(screen.queryByText(/^Status: Draft$/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-continue-review")).toHaveAttribute("href", "/architecture/reviews/run-001");
    expect(screen.getByTestId("architecture-draft-acknowledge-edit")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-start-review")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Architecture overview/i)).toBeDisabled();
  });

  it("unlocks editing after the user acknowledges post-spawn divergence", async () => {
    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-acknowledge-edit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-draft-acknowledge-edit"));

    expect(acknowledgeArchitectureDraftHandoff).toHaveBeenCalledWith("arch-001", "run-001");

    await waitFor(() => {
      expect(screen.getByLabelText(/Architecture overview/i)).not.toBeDisabled();
    });

    expect(screen.queryByTestId("architecture-draft-acknowledge-edit")).not.toBeInTheDocument();
  });

  it("discloses autosave and omits a disabled Save draft when autosave is authoritative (TB-1455)", async () => {
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "saved",
      lastSavedUtc: "2026-07-18T22:00:00.000Z",
      conflictMessage: null,
      saveDraft,
      reloadDraft,
      hasPersistedDraft: true,
    });

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-autosave-reassurance")).toHaveTextContent(
        ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE,
      );
    });

    expect(screen.queryByTestId("architecture-save-draft")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-save-draft-retry")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-save-and-exit")).toBeInTheDocument();
  });

  it("offers Save now only when autosave cannot complete (TB-1455)", async () => {
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "error",
      lastSavedUtc: null,
      conflictMessage: null,
      saveDraft,
      reloadDraft,
      hasPersistedDraft: true,
    });

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-save-draft-retry")).toHaveTextContent("Save now");
    });
  });
});
