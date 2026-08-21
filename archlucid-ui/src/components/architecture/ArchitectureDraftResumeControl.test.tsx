import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
const getDraftRequest = vi.fn();
const reopenDraftRequest = vi.fn();
const showError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  reopenDraftRequest: (...args: unknown[]) => reopenDraftRequest(...args),
}));

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/architecture/architecture-draft-resume-telemetry", () => ({
  trackArchitectureDraftResumeClick: vi.fn(),
}));

import { ArchitectureDraftResumeControl } from "@/components/architecture/ArchitectureDraftResumeControl";
import {
  ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL,
  ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE,
  ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL,
} from "@/lib/architecture/architecture-draft-intake-mode";

function draftResponse(status: "Drafting" | "Admitted" | "RunSpawned") {
  return {
    draftId: "draft-001",
    tenantId: "tenant",
    workspaceId: "ws",
    projectId: "default",
    status,
    document: {
      freeTextIntent: "Claims intake",
      actorSet: { actors: [] },
    },
    spawnedRunId: status === "RunSpawned" ? "run-001" : null,
    createdUtc: "2026-01-01T00:00:00.000Z",
    updatedUtc: "2026-01-02T00:00:00.000Z",
  };
}

describe("ArchitectureDraftResumeControl", () => {
  beforeEach(() => {
    push.mockReset();
    getDraftRequest.mockReset();
    reopenDraftRequest.mockReset();
    showError.mockReset();
  });

  it("opens the draft when it is still drafting", async () => {
    getDraftRequest.mockResolvedValue(draftResponse("Drafting"));

    render(
      <ArchitectureDraftResumeControl
        architectureId="draft-001"
        label="Continue editing"
        source="architectures-list"
        testId="resume-continue"
      />,
    );

    fireEvent.click(screen.getByTestId("resume-continue"));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/architecture/architectures/draft-001");
    });

    expect(screen.queryByTestId("architecture-draft-intake-mode-dialog")).not.toBeInTheDocument();
  });

  it("asks continue vs unlock before opening an admitted draft", async () => {
    getDraftRequest.mockResolvedValue(draftResponse("Admitted"));

    render(
      <ArchitectureDraftResumeControl
        architectureId="draft-001"
        label="Continue editing"
        source="architectures-list"
        testId="resume-continue"
      />,
    );

    fireEvent.click(screen.getByTestId("resume-continue"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-intake-mode-dialog")).toHaveTextContent(
        ARCHITECTURE_DRAFT_INTAKE_MODE_TITLE,
      );
    });

    expect(push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DRAFT_INTAKE_MODE_CONTINUE_LABEL }));

    expect(push).toHaveBeenCalledWith(
      "/architecture/reviews/new?path=guided-intake&sourceArchitectureId=draft-001",
    );
  });

  it("unlocks an admitted draft then opens the editor", async () => {
    getDraftRequest.mockResolvedValue(draftResponse("Admitted"));
    reopenDraftRequest.mockResolvedValue(draftResponse("Drafting"));

    render(
      <ArchitectureDraftResumeControl
        architectureId="draft-001"
        label="Continue editing"
        source="architectures-list"
        testId="resume-continue"
      />,
    );

    fireEvent.click(screen.getByTestId("resume-continue"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: ARCHITECTURE_DRAFT_INTAKE_MODE_UNLOCK_LABEL }));

    await waitFor(() => {
      expect(reopenDraftRequest).toHaveBeenCalledWith("draft-001");
    });

    expect(push).toHaveBeenCalledWith("/architecture/architectures/draft-001");
  });
});
