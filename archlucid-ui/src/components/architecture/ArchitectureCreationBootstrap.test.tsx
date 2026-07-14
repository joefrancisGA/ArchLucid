import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listArchitectureDraftRegistryEntries = vi.fn();
const initializeArchitectureCreation = vi.fn();
const clearArchitectureCreationDraftId = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/architecture-draft-registry", () => ({
  listArchitectureDraftRegistryEntries: () => listArchitectureDraftRegistryEntries(),
}));

vi.mock("@/lib/architecture-creation-init", () => ({
  initializeArchitectureCreation: () => initializeArchitectureCreation(),
}));

vi.mock("@/lib/architecture-creation-session", () => ({
  clearArchitectureCreationDraftId: () => clearArchitectureCreationDraftId(),
}));

vi.mock("@/lib/architecture-draft-resume-telemetry", () => ({
  trackArchitectureDraftResumeClick: vi.fn(),
}));

import { ArchitectureCreationBootstrap } from "./ArchitectureCreationBootstrap";

beforeEach(() => {
  listArchitectureDraftRegistryEntries.mockReset();
  initializeArchitectureCreation.mockReset();
  clearArchitectureCreationDraftId.mockReset();
  replace.mockReset();
});

describe("ArchitectureCreationBootstrap", () => {
  it("offers resume choices when drafts already exist", () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Claims intake draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
    ]);

    render(<ArchitectureCreationBootstrap />);

    expect(screen.getByTestId("architecture-creation-bootstrap-resume-choice")).toBeInTheDocument();
    expect(initializeArchitectureCreation).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Claims intake draft/i })).toHaveAttribute("href", "/architectures/draft-001");
  });

  it("creates a new draft immediately when no drafts exist", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([]);
    initializeArchitectureCreation.mockResolvedValue({ draftId: "draft-new" });

    render(<ArchitectureCreationBootstrap />);

    await waitFor(() => {
      expect(initializeArchitectureCreation).toHaveBeenCalledTimes(1);
    });

    expect(replace).toHaveBeenCalledWith("/architectures/draft-new");
  });

  it("starts a new draft when the user chooses create from the resume screen", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Claims intake draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
    ]);
    initializeArchitectureCreation.mockResolvedValue({ draftId: "draft-new" });

    render(<ArchitectureCreationBootstrap />);

    fireEvent.click(screen.getByTestId("architecture-creation-start-new"));

    await waitFor(() => {
      expect(initializeArchitectureCreation).toHaveBeenCalledTimes(1);
    });

    expect(clearArchitectureCreationDraftId).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/architectures/draft-new");
  });
});
