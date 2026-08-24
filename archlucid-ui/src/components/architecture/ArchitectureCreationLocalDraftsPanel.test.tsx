import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureCreationLocalDraftsPanel } from "@/components/architecture/ArchitectureCreationLocalDraftsPanel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  reopenDraftRequest: vi.fn(),
}));
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { CONTINUE_DRAFT_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE,
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

  it("renders nothing when no drafts exist", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    const { container } = render(<ArchitectureCreationLocalDraftsPanel />);

    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });

    expect(screen.queryByTestId("architecture-creation-resume-drafts")).toBeNull();
  });

  it("shows resume drafts with account-sync honesty and view-all link", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      entry({ architectureId: "draft-001", displayName: "Claims intake" }),
    ]);

    render(<ArchitectureCreationLocalDraftsPanel />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-creation-resume-drafts")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURE_CREATION_CONTINUE_SECTION_TITLE })).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_CREATION_RECENT_DRAFTS_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("architecture-creation-resume-draft-continue-draft-001")).toHaveTextContent(
      CONTINUE_DRAFT_LABEL,
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
