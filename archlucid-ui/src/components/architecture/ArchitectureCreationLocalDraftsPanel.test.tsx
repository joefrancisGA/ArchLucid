import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { CONTINUE_DRAFT_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE,
  ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
  ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY,
  ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL,
} from "@/lib/create-vs-review-intake-copy";

const useArchitectureDraftRegistryEntries = vi.fn();

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
}));

function entry(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "architectureId">,
): ArchitectureDraftRegistryEntry {
  return {
    architectureId: overrides.architectureId,
    displayName: overrides.displayName ?? "Healthcare Claims Platform",
    customerStatus: overrides.customerStatus ?? "draft",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
  };
}

describe("ArchitectureCreationLocalDraftsPanel (TB-1459)", () => {
  beforeEach(() => {
    useArchitectureDraftRegistryEntries.mockReset();
  });

  it("shows browser-local empty guidance when no drafts exist", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitectureCreationLocalDraftsPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-no-drafts-guidance")).toHaveTextContent(
        ARCHITECTURE_CREATION_NO_DRAFTS_GUIDANCE,
      );
    });

    expect(screen.queryByTestId("architecture-creation-resume-drafts")).toBeNull();
  });

  it("shows resume drafts with browser-local honesty and view-all link", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      entry({ architectureId: "draft-001", displayName: "Claims intake" }),
    ]);

    render(<ArchitectureCreationLocalDraftsPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-resume-drafts")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CONTINUE_DRAFT_LABEL })).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-001",
    );
    expect(screen.getByTestId("architecture-creation-resume-drafts-view-all")).toHaveAttribute(
      "href",
      "/architecture/architectures",
    );
    expect(screen.getByTestId("architecture-creation-resume-drafts-view-all")).toHaveTextContent(
      ARCHITECTURE_CREATION_VIEW_ALL_DRAFTS_LABEL,
    );
  });
});
