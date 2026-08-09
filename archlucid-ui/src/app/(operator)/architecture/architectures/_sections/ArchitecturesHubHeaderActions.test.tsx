import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture-draft-registry";

import { ArchitecturesHubHeaderActions } from "./ArchitecturesHubHeaderActions";

const useArchitectureDraftRegistryEntries = vi.fn<() => readonly ArchitectureDraftRegistryEntry[]>();
const navigate = vi.fn();

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
}));

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate,
    isNavigating: false,
    loadingLabel: "Opening…",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <button type="button">Help</button>,
}));

describe("ArchitecturesHubHeaderActions", () => {
  beforeEach(() => {
    useArchitectureDraftRegistryEntries.mockReset();
    navigate.mockReset();
  });

  it("omits the header Create architecture CTA when the registry is empty", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitecturesHubHeaderActions />);

    expect(screen.queryByTestId("architectures-page-create")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Help" })).toBeInTheDocument();
  });

  it("shows Create architecture in the header when drafts already exist", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "arch-1",
        displayName: "Claims platform",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-07-12T23:42:05.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-07-12T23:42:05.000Z",
      },
    ]);

    render(<ArchitecturesHubHeaderActions />);

    expect(screen.getByTestId("architectures-page-create")).toHaveTextContent("Create architecture");
  });
});
