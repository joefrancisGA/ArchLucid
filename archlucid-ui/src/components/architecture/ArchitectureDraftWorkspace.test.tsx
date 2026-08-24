import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";

const getDraftRequest = vi.fn();
const reopenDraftRequest = vi.fn();
const getRunSummary = vi.fn();
const saveDraft = vi.fn();
const reloadDraft = vi.fn();
const acknowledgeArchitectureDraftHandoff = vi.fn();
const isArchitectureDraftHandoffAcknowledged = vi.fn();

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/lib/api/draft-intake-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/draft-intake-api")>("@/lib/api/draft-intake-api");

  return {
    ...actual,
    getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
    reopenDraftRequest: (...args: unknown[]) => reopenDraftRequest(...args),
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
    acceptServerBaseline: vi.fn(),
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

vi.mock("@/lib/architecture/architecture-draft-handoff-gate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/architecture/architecture-draft-handoff-gate")>(
    "@/lib/architecture/architecture-draft-handoff-gate",
  );

  return {
    ...actual,
    acknowledgeArchitectureDraftHandoff: (...args: unknown[]) => acknowledgeArchitectureDraftHandoff(...args),
    isArchitectureDraftHandoffAcknowledged: (...args: unknown[]) => isArchitectureDraftHandoffAcknowledged(...args),
    trackArchitectureDraftPostSpawnEdit: vi.fn(),
  };
});

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

// Stubbed so header placement is asserted independently of help-topic resolution for the draft route.
vi.mock("@/components/usability/PageContextualHelpButton", async () => {
  const actual = await vi.importActual<typeof import("@/components/usability/PageContextualHelpButton")>(
    "@/components/usability/PageContextualHelpButton",
  );

  return {
    ...actual,
    PageContextualHelpButton: () => <span data-testid="page-contextual-help-stub" />,
  };
});

import { ArchitectureDraftWorkspace } from "./ArchitectureDraftWorkspace";
import { ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR } from "@/lib/architecture/architecture-draft-detail-page-copy";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture/architecture-draft-guidance-dismiss";
import { ARCHITECTURE_NEW_DRAFT_SEGMENT } from "@/lib/architecture/architecture-routes";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { useArchitectureDraftAutosave } from "@/hooks/use-architecture-draft-autosave";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { showError, showSuccess } from "@/lib/toast";

const readyStructuredBriefDocument = {
  confirmedConstraints: ["Private endpoints required"],
  confirmedAssumptions: ["Team operates in a single region"],
  confirmedRequiredCapabilities: [],
  suggestedConstraints: [],
  suggestedAssumptions: [],
  suggestedRequiredCapabilities: [],
  qualityAttribute: "RTO 4 hours",
  failureModeNote: "",
  operationalOwner: "",
};

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
  reopenDraftRequest.mockReset();
  acknowledgeArchitectureDraftHandoff.mockReset();
  isArchitectureDraftHandoffAcknowledged.mockReturnValue(false);
  getDraftRequest.mockResolvedValue(spawnedDraft);
  getRunSummary.mockResolvedValue({
    runId: "run-001",
    displayName: "Claims intake modernization",
  });
  vi.mocked(showError).mockReset();
  vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
    saveState: "idle",
    lastSavedUtc: null,
    conflictMessage: null,
    saveDraft,
    reloadDraft,
    acceptServerBaseline: vi.fn(),
    hasPersistedDraft: true,
  });
});

describe("ArchitectureDraftWorkspace", () => {
  it("anchors page help in the header rail outside the dismissible tip", async () => {
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

    const help = screen.getByTestId("page-contextual-help-stub");
    const deleteControl = screen.getByTestId("architecture-draft-delete-workspace");

    expect(help.parentElement).toBe(deleteControl.parentElement);
    expect(help.compareDocumentPosition(deleteControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByTestId("architecture-draft-save-status")).not.toBeInTheDocument();

    const disclosure = await screen.findByTestId("architecture-draft-guidance-disclosure");
    expect(disclosure).not.toContainElement(help);

    fireEvent.click(screen.getByTestId("architecture-draft-guidance-dismiss"));

    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-stub")).toBeInTheDocument();
  });

  it("opens the empty workspace immediately on /new without fetching a draft", async () => {
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "idle",
      lastSavedUtc: null,
      conflictMessage: null,
      saveDraft,
      reloadDraft,
      acceptServerBaseline: vi.fn(),
      hasPersistedDraft: false,
    });

    render(<ArchitectureDraftWorkspace architectureId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />);

    expect(getDraftRequest).not.toHaveBeenCalled();
    expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-creation-new-draft-section-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-workspace-lead")).not.toBeInTheDocument();

    expect(screen.queryByTestId("architecture-creation-no-drafts-guidance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-save-status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeDisabled();
    expect(screen.getByTestId("architecture-scope-understanding-confirm")).toBeDisabled();
    expect(screen.getByTestId("architecture-draft-review-readiness")).toBeInTheDocument();
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

  it("omits workspace hero copy on /new when registry entries exist (TB-1462)", async () => {
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

    expect(screen.queryByTestId("architecture-draft-workspace-lead")).not.toBeInTheDocument();
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

  it("shows a skeleton without list wayfinding while loading an existing draft (TB-1453)", async () => {
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
    expect(screen.queryByTestId("architecture-draft-workspace-back-to-list")).not.toBeInTheDocument();

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

  it("loads an existing draft only once per architecture id on mount", async () => {
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

    expect(getDraftRequest).toHaveBeenCalledTimes(1);
    expect(getDraftRequest).toHaveBeenCalledWith("arch-001");
  });

  it("surfaces proxy rate-limit copy when draft load returns 429", async () => {
    getDraftRequest.mockRejectedValue(
      new ApiRequestError("Too many requests", {
        problem: null,
        correlationId: "cid-429",
        httpStatus: 429,
        retryAfterSeconds: 12,
      }),
    );

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Too many requests while loading this draft/i);
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/Wait about 12 seconds/i);
    expect(getDraftRequest).toHaveBeenCalledTimes(1);
  });

  it("omits back-to-list wayfinding on loaded edit routes — the sidebar is the return path", async () => {
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

    expect(screen.queryByTestId("architecture-draft-workspace-back-to-list")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Back to Architecture drafts/i })).not.toBeInTheDocument();
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
        ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR,
      );
    });

    expect(screen.getByTestId("draft-intake-advanced-section")).toBeInTheDocument();
    expect(
      screen.getByTestId("draft-intake-advanced-section").querySelector(
        '[data-testid="architecture-draft-ai-refine-stub"]',
      ),
    ).toBeNull();
    expect(screen.getByTestId("architecture-draft-ai-budget-notice")).toHaveTextContent(
      "Architecture reasoning uses AI budget.",
    );
    expect(screen.getByTestId("architecture-draft-pre-execute-cost")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-pre-execute-cost-message")).toHaveTextContent(
      /included in your plan's AI usage|architecture package/i,
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
    expect(screen.queryByTestId("architecture-draft-ai-refine-stub")).not.toBeInTheDocument();
  });

  it("locks the editor and promotes the linked review when a draft already spawned a review", async () => {
    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-handoff-banner")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-draft-workspace-status-tag")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show details" })).not.toBeInTheDocument();
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

  it("warns at the top and freezes the form when the draft is already in review intake", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Admitted",
      spawnedRunId: null,
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-intake-mode-banner")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-start-review")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-scope-understanding-check")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-continue-intake")).toHaveAttribute(
      "href",
      "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=arch-001",
    );
    expect(screen.getByTestId("architecture-draft-unlock-brief")).toBeInTheDocument();
    expect(screen.getByLabelText(/Architecture overview/i)).toBeDisabled();
  });

  it("refreshes draft lifecycle on tab resume when intake started elsewhere", async () => {
    const draftingCopy = {
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: { ...spawnedDraft.document, workflowIntent: "create-architecture" },
    };
    const admittedCopy = {
      ...draftingCopy,
      status: "Admitted",
    };

    getDraftRequest.mockResolvedValueOnce(draftingCopy).mockResolvedValueOnce(admittedCopy);

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-scope-understanding-check")).toBeInTheDocument();
    });

    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-intake-mode-banner")).toBeInTheDocument();
    });

    expect(getDraftRequest).toHaveBeenCalledTimes(2);
  });

  it("returns the brief to drafting when the operator unlocks intake", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Admitted",
      spawnedRunId: null,
    });
    reopenDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-unlock-brief")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-draft-unlock-brief"));

    await waitFor(() => {
      expect(reopenDraftRequest).toHaveBeenCalledWith("arch-001");
    });

    await waitFor(() => {
      expect(screen.queryByTestId("architecture-draft-intake-mode-banner")).not.toBeInTheDocument();
    });

    expect(showSuccess).toHaveBeenCalledWith("Architecture unlocked — you can edit the brief.");
    expect(screen.getByLabelText(/Architecture overview/i)).not.toBeDisabled();
  });

  it("hydrates system name and business outcome from the server draft", async () => {
    const acceptServerBaseline = vi.fn();
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "idle",
      lastSavedUtc: null,
      conflictMessage: null,
      saveDraft,
      reloadDraft,
      acceptServerBaseline,
      hasPersistedDraft: true,
    });

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-system-name")).toHaveValue("Claims intake");
    });

    expect(screen.getByTestId("architecture-draft-outcome")).toHaveValue("Reduce manual routing");
    expect(acceptServerBaseline).toHaveBeenCalledWith(
      expect.objectContaining({
        freeTextIntent: "Claims intake modernization",
        businessOutcome: "Reduce manual routing",
        systemName: "Claims intake",
      }),
      spawnedDraft.updatedUtc,
    );
  });

  it("omits autosave status UI when autosave is authoritative (TB-1455)", async () => {
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "saved",
      lastSavedUtc: "2026-07-18T22:00:00.000Z",
      conflictMessage: null,
      saveDraft,
      reloadDraft,
      acceptServerBaseline: vi.fn(),
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
      expect(screen.getByTestId("architecture-draft-workspace")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-draft-save-status")).not.toBeInTheDocument();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
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
      acceptServerBaseline: vi.fn(),
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

  it("shows a concurrent-edit conflict on the page without toasting when Save now fails (TB-2006)", async () => {
    const conflictText =
      "This architecture was updated in another session. Refresh to load the latest version before saving again.";
    saveDraft.mockResolvedValue(false);
    vi.mocked(useArchitectureDraftAutosave).mockReturnValue({
      saveState: "error",
      lastSavedUtc: null,
      conflictMessage: conflictText,
      saveDraft,
      reloadDraft,
      acceptServerBaseline: vi.fn(),
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
      expect(screen.getByTestId("architecture-draft-conflict-message")).toHaveTextContent(conflictText);
    });

    fireEvent.click(screen.getByTestId("architecture-save-draft-retry"));

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalled();
    });

    expect(screen.getByTestId("architecture-draft-conflict-refresh")).toBeInTheDocument();
    expect(vi.mocked(showError)).not.toHaveBeenCalled();
  });

  it("disables Start review and shows inline readiness when overview/outcome are below minimum (TB-2006)", async () => {
    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: {
        ...spawnedDraft.document,
        freeTextIntent: "too short",
        businessOutcome: "brief",
        workflowIntent: "create-architecture",
      },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-start-review")).toBeDisabled();
    });

    expect(screen.getByTestId("architecture-draft-review-readiness")).toHaveTextContent(
      /architecture overview of at least/i,
    );
    expect(screen.getByTestId("architecture-draft-intent")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("architecture-draft-outcome")).toHaveAttribute("aria-invalid", "true");

    fireEvent.click(screen.getByTestId("architecture-start-review"));

    expect(vi.mocked(showError)).not.toHaveBeenCalled();
  });

  it("shows staged progress while Start review prepares the draft, before any navigation", async () => {
    const longOverview =
      "Claims intake modernization covering intake channels, routing rules, exception queues, and operator handoffs across the claims workspace.";

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: {
        ...spawnedDraft.document,
        freeTextIntent: longOverview,
        businessOutcome: "Reduce manual routing",
        workflowIntent: "create-architecture",
        structuredBrief: readyStructuredBriefDocument,
        actorSet: {
          actors: [
            {
              label: "Primary operator",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
    });

    let resolveSave: (value: boolean) => void = () => {};
    saveDraft.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveSave = resolve;
      }),
    );

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-scope-understanding-confirm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-start-review")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("architecture-start-review"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-start-review-progress")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-start-review-progress")).toHaveTextContent(
      /Creating review workspace/i,
    );
    expect(screen.getByTestId("architecture-start-review")).toHaveAttribute("data-loading", "true");
    expect(screen.queryByTestId("architecture-start-review-stall")).toBeNull();

    resolveSave(true);
  });

  it("keeps Start review disabled for scope until confirm, with on-form hint and no validation toast (TB-2006)", async () => {
    const longOverview =
      "Claims intake modernization covering intake channels, routing rules, exception queues, and operator handoffs across the claims workspace.";

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: {
        ...spawnedDraft.document,
        freeTextIntent: longOverview,
        businessOutcome: "Reduce manual routing",
        workflowIntent: "create-architecture",
        structuredBrief: readyStructuredBriefDocument,
        actorSet: {
          actors: [
            {
              label: "Primary operator",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-start-review")).toBeDisabled();
    });

    expect(screen.getByTestId("architecture-draft-scope-readiness")).toHaveTextContent(
      /Confirm the in-scope understanding before starting a review/i,
    );
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeDisabled();

    fireEvent.click(screen.getByTestId("architecture-start-review"));

    expect(vi.mocked(showError)).not.toHaveBeenCalled();
  });

  it("shows quality-attribute encouragement modal instead of blocking Start review when quality attributes are empty", async () => {
    const longOverview =
      "Claims intake modernization covering intake channels, routing rules, exception queues, and operator handoffs across the claims workspace.";

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: {
        ...spawnedDraft.document,
        freeTextIntent: longOverview,
        businessOutcome: "Reduce manual routing",
        workflowIntent: "create-architecture",
        structuredBrief: {
          ...readyStructuredBriefDocument,
          qualityAttribute: "",
        },
        actorSet: {
          actors: [
            {
              label: "Primary operator",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
    });

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-scope-understanding-confirm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-start-review")).not.toBeDisabled();
    });

    expect(screen.queryByTestId("architecture-draft-review-readiness")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("architecture-start-review"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-quality-attributes-encouragement-dialog")).toBeInTheDocument();
    });

    expect(saveDraft).not.toHaveBeenCalled();
  });

  it("continues Start review after choosing to proceed without quality attributes", async () => {
    const longOverview =
      "Claims intake modernization covering intake channels, routing rules, exception queues, and operator handoffs across the claims workspace.";

    getDraftRequest.mockResolvedValue({
      ...spawnedDraft,
      status: "Drafting",
      spawnedRunId: null,
      document: {
        ...spawnedDraft.document,
        freeTextIntent: longOverview,
        businessOutcome: "Reduce manual routing",
        workflowIntent: "create-architecture",
        structuredBrief: {
          ...readyStructuredBriefDocument,
          qualityAttribute: "",
        },
        actorSet: {
          actors: [
            {
              label: "Primary operator",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
    });

    saveDraft.mockResolvedValue(true);

    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-scope-understanding-confirm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-start-review")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("architecture-start-review"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-quality-attributes-encouragement-dialog")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-draft-quality-attributes-encouragement-continue"));

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalled();
    });
  });
});
