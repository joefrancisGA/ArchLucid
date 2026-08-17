import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitecturesNewPageSubtitle } from "@/app/(operator)/architecture/architectures/new/_sections/ArchitecturesNewPageSubtitle";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
} from "@/lib/create-vs-review-intake-copy";

const useArchitectureDraftRegistryEntries = vi.fn();

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

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

describe("ArchitecturesNewPageSubtitle (TB-1462)", () => {
  beforeEach(() => {
    useArchitectureDraftRegistryEntries.mockReset();
  });

  it("uses resume-first subtitle when browser-local drafts exist", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "draft-001" })]);

    render(<ArchitecturesNewPageSubtitle />);

    await waitFor(() => {
      expect(screen.getByText(ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS)).toBeInTheDocument();
    });
  });

  it("keeps neutral subtitle when no browser-local drafts exist", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitecturesNewPageSubtitle />);

    await waitFor(() => {
      expect(screen.getByText(ARCHITECTURE_CREATION_PAGE_SUBTITLE)).toBeInTheDocument();
    });
  });
});
