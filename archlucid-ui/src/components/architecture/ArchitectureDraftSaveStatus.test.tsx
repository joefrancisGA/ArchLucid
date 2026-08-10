import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftSaveStatus } from "@/components/architecture/ArchitectureDraftSaveStatus";
import { ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE } from "@/lib/create-vs-review-intake-copy";

describe("ArchitectureDraftSaveStatus", () => {
  it("does not claim Saved before the user has persisted edits", () => {
    render(<ArchitectureDraftSaveStatus saveState="idle" lastSavedUtc={null} hasPersistedDraft={false} />);

    expect(screen.getByTestId("architecture-draft-save-status")).toHaveAttribute("data-save-state", "idle");
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-autosave-reassurance")).not.toBeInTheDocument();
  });

  it("shows autosave reassurance only after a draft exists (TB-1460)", () => {
    const { rerender } = render(
      <ArchitectureDraftSaveStatus saveState="idle" lastSavedUtc={null} hasPersistedDraft={false} />,
    );

    expect(screen.queryByTestId("architecture-draft-autosave-reassurance")).not.toBeInTheDocument();

    rerender(<ArchitectureDraftSaveStatus saveState="saved" lastSavedUtc="2026-07-18T22:00:00.000Z" hasPersistedDraft />);

    expect(screen.getByTestId("architecture-draft-autosave-reassurance")).toHaveTextContent(
      ARCHITECTURE_CREATION_AUTOSAVE_REASSURANCE,
    );
  });

  it("shows Saved after a successful persist", () => {
    render(
      <ArchitectureDraftSaveStatus saveState="saved" lastSavedUtc="2026-07-18T22:00:00.000Z" />,
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-autosave-reassurance")).toBeInTheDocument();
  });

  it("omits autosave reassurance when autosave is disabled", () => {
    render(<ArchitectureDraftSaveStatus saveState="idle" lastSavedUtc={null} autosaveActive={false} />);

    expect(screen.queryByTestId("architecture-draft-autosave-reassurance")).not.toBeInTheDocument();
  });

  it("omits autosave reassurance when save failed or offline (TB-1455)", () => {
    const { rerender } = render(<ArchitectureDraftSaveStatus saveState="error" lastSavedUtc={null} />);

    expect(screen.queryByTestId("architecture-draft-autosave-reassurance")).not.toBeInTheDocument();

    rerender(<ArchitectureDraftSaveStatus saveState="offline" lastSavedUtc={null} />);

    expect(screen.queryByTestId("architecture-draft-autosave-reassurance")).not.toBeInTheDocument();
  });
});
