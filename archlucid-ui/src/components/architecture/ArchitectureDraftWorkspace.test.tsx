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
  useArchitectureDraftAutosave: () => ({
    saveState: "saved",
    lastSavedUtc: "2026-01-02T00:00:00.000Z",
    conflictMessage: null,
    saveDraft,
    reloadDraft,
  }),
}));

vi.mock("@/hooks/use-unsaved-changes-guard", () => ({
  useUnsavedChangesGuard: vi.fn(),
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
});

describe("ArchitectureDraftWorkspace", () => {
  it("locks the editor and promotes the linked review when a draft already spawned a review", async () => {
    render(<ArchitectureDraftWorkspace architectureId="arch-001" />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-handoff-banner")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-continue-review")).toHaveAttribute("href", "/reviews/run-001");
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
});
