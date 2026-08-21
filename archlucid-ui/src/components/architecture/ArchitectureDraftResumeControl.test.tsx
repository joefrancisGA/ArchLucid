import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DraftRequestResponse } from "@/types/draft-intake";

const routerPush = vi.fn();
const getDraftRequest = vi.fn();
const reopenDraftRequest = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn() }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  reopenDraftRequest: (...args: unknown[]) => reopenDraftRequest(...args),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
}));

import { ArchitectureDraftResumeControl } from "./ArchitectureDraftResumeControl";

function draft(status: DraftRequestResponse["status"]): DraftRequestResponse {
  return {
    draftId: "arch-001",
    tenantId: "tenant",
    workspaceId: "ws",
    projectId: "default",
    status,
    document: {
      freeTextIntent: "Claims intake",
      actorSet: { actors: [] },
    },
    createdUtc: "2026-01-01T00:00:00.000Z",
    updatedUtc: "2026-01-02T00:00:00.000Z",
  };
}

describe("ArchitectureDraftResumeControl", () => {
  beforeEach(() => {
    routerPush.mockReset();
    getDraftRequest.mockReset();
    reopenDraftRequest.mockReset();
  });

  it("navigates to the draft when the architecture is still drafting", async () => {
    getDraftRequest.mockResolvedValue(draft("Drafting"));

    render(
      <ArchitectureDraftResumeControl
        architectureId="arch-001"
        label="Continue editing"
        source="architectures-list"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue editing" }));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/architecture/architectures/arch-001");
    });

    expect(screen.queryByTestId("architecture-draft-intake-mode-dialog")).not.toBeInTheDocument();
  });

  it("opens the intake dialog when the architecture is already admitted", async () => {
    getDraftRequest.mockResolvedValue(draft("Admitted"));

    render(
      <ArchitectureDraftResumeControl
        architectureId="arch-001"
        label="Continue editing"
        source="reviews-hub"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue editing" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-intake-mode-dialog")).toBeInTheDocument();
    });

    expect(routerPush).not.toHaveBeenCalled();
  });

  it("reopens the draft then navigates after unlock", async () => {
    getDraftRequest.mockResolvedValue(draft("Admitted"));
    reopenDraftRequest.mockResolvedValue(draft("Drafting"));

    render(
      <ArchitectureDraftResumeControl
        architectureId="arch-001"
        label="Continue editing"
        source="architectures-new"
        variant="primary"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue editing" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-intake-mode-dialog-unlock")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-draft-intake-mode-dialog-unlock"));

    await waitFor(() => {
      expect(reopenDraftRequest).toHaveBeenCalledWith("arch-001");
    });

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/architecture/architectures/arch-001");
    });
  });
});
