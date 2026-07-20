import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchitectureDraftSaveStatus } from "@/components/architecture/ArchitectureDraftSaveStatus";

describe("ArchitectureDraftSaveStatus", () => {
  it("does not claim Saved before the user has persisted edits", () => {
    render(<ArchitectureDraftSaveStatus saveState="idle" lastSavedUtc={null} />);

    expect(screen.getByTestId("architecture-draft-save-status")).toHaveAttribute("data-save-state", "idle");
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("shows Saved after a successful persist", () => {
    render(
      <ArchitectureDraftSaveStatus saveState="saved" lastSavedUtc="2026-07-18T22:00:00.000Z" />,
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
