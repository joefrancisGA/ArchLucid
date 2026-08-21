import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture/architecture-draft-guidance-dismiss";

const useArchitectureDraftRegistryEntries = vi.fn<() => readonly ArchitectureDraftRegistryEntry[]>();
const useArchitectureDraftRegistryHydrated = vi.fn<() => boolean>();

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
  useArchitectureDraftRegistryHydrated: () => useArchitectureDraftRegistryHydrated(),
}));

import { ArchitectureDraftListClient } from "./ArchitectureDraftListClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  reopenDraftRequest: vi.fn(),
}));

function entry(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "architectureId">,
): ArchitectureDraftRegistryEntry {
  return {
    architectureId: overrides.architectureId,
    displayName: overrides.displayName ?? "Healthcare Claims Platform",
    customerStatus: overrides.customerStatus ?? "ready-for-review",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
  };
}

describe("ArchitectureDraftListClient buyer-polished shell", () => {
  beforeEach(() => {
    useArchitectureDraftRegistryEntries.mockReset();
    useArchitectureDraftRegistryHydrated.mockReset();
    useArchitectureDraftRegistryHydrated.mockReturnValue(true);
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
  });

  it("hides vocabulary rails and shows draft id disclosure", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "draft-abc-123" })]);

    render(<ArchitectureDraftListClient />);

    expect(screen.queryByTestId("projects-recycle-drafts-package-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("path-chooser-create-object-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-id-draft-abc-123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
  });
});
