import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "@/lib/api-request-error";
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
        draftId="arch-001"
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
        draftId="arch-001"
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
        draftId="arch-001"
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

  it("shows an inline error instead of a toast when opening the draft fails", async () => {
    getDraftRequest.mockRejectedValue(
      new ApiRequestError("Draft not found in this tenant.", {
        problem: { title: "Not Found", detail: "Draft not found in this tenant.", type: "about:blank" },
        correlationId: "corr-resume-001",
        httpStatus: 404,
      }),
    );

    render(
      <ArchitectureDraftResumeControl
        draftId="arch-001"
        label="Continue draft"
        source="architectures-new"
        variant="primary"
        testId="architecture-creation-resume-draft-continue-arch-001"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue draft" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-resume-draft-continue-arch-001-inline-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-creation-resume-draft-continue-arch-001-inline-error")).toHaveTextContent(
      "Could not open this architecture.",
    );
    expect(screen.getByTestId("architecture-creation-resume-draft-continue-arch-001-inline-error")).toHaveTextContent(
      "Draft not found in this tenant.",
    );
    expect(screen.getByTestId("architecture-creation-resume-draft-continue-arch-001-inline-error")).toHaveTextContent(
      "Correlation ID: corr-resume-001",
    );
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("shows an inline error when unlock fails", async () => {
    getDraftRequest.mockResolvedValue(draft("Admitted"));
    reopenDraftRequest.mockRejectedValue(
      new ApiRequestError("Unlock is not allowed for this draft.", {
        problem: { title: "Conflict", detail: "Unlock is not allowed for this draft.", type: "about:blank" },
        correlationId: "corr-unlock-001",
        httpStatus: 409,
      }),
    );

    render(
      <ArchitectureDraftResumeControl
        draftId="arch-001"
        label="Continue draft"
        source="architectures-new"
        variant="primary"
        testId="architecture-creation-resume-draft-continue-arch-001"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue draft" }));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-intake-mode-dialog-unlock")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("architecture-draft-intake-mode-dialog-unlock"));

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-resume-draft-continue-arch-001-inline-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-creation-resume-draft-continue-arch-001-inline-error")).toHaveTextContent(
      "Could not unlock this architecture.",
    );
    expect(screen.queryByTestId("architecture-draft-intake-mode-dialog")).not.toBeInTheDocument();
  });
});
