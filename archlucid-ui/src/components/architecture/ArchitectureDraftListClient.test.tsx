import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture/architecture-draft-guidance-dismiss";

import { ArchitectureDraftListClient } from "./ArchitectureDraftListClient";

const useArchitectureDraftRegistryEntries = vi.fn<() => readonly ArchitectureDraftRegistryEntry[]>();
const useArchitectureDraftRegistryHydrated = vi.fn<() => boolean>();

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
  useArchitectureDraftRegistryHydrated: () => useArchitectureDraftRegistryHydrated(),
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

describe("ArchitectureDraftListClient", () => {
  beforeEach(() => {
    useArchitectureDraftRegistryEntries.mockReset();
    useArchitectureDraftRegistryHydrated.mockReset();
    useArchitectureDraftRegistryHydrated.mockReturnValue(true);
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
  });

  it("shows filter chip counts from the full registry", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      entry({ architectureId: "a1", customerStatus: "draft", linkedReviewId: null }),
      entry({ architectureId: "a2", customerStatus: "ready-for-review", linkedReviewId: null }),
      entry({
        architectureId: "a3",
        customerStatus: "archived",
        linkedReviewId: "run-1",
        displayName: "Archived platform",
      }),
    ]);

    render(<ArchitectureDraftListClient />);

    expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter architectures: All (3)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter architectures: Draft (1)" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter architectures: Ready for review (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter architectures: No review yet (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter architectures: Archived (1)" })).toBeInTheDocument();
  });

  it("renders ready-for-review with in-progress status semantics and hybrid updated time", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      entry({
        architectureId: "a1",
        displayName: "Healthcare Claims Platform",
        customerStatus: "ready-for-review",
        lastUpdatedUtc: "2026-07-12T23:42:05.000Z",
      }),
    ]);

    render(<ArchitectureDraftListClient />);

    expect(screen.getByText("Healthcare Claims Platform")).toBeInTheDocument();

    const row = screen.getByTestId("architecture-draft-row-a1");
    const status = within(row).getByText("Ready for review");

    expect(status.className).toMatch(/sky/i);

    const updated = within(row).getByText(/Updated/i);

    expect(updated.closest("time")?.getAttribute("dateTime")).toBe("2026-07-12T23:42:05.000Z");
    expect(updated.textContent ?? "").toMatch(/Updated .+ · /);
  });

  it("shows a loading skeleton before registry hydrate (TB-1450)", () => {
    useArchitectureDraftRegistryHydrated.mockReturnValue(false);
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitectureDraftListClient />);

    expect(screen.getByTestId("architecture-draft-list-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list-empty")).not.toBeInTheDocument();
  });

  it("does not flash the empty state before registry hydrate when drafts exist (TB-1450)", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "a1" })]);

    render(<ArchitectureDraftListClient />);

    expect(screen.queryByTestId("architecture-draft-list-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-list-table")).toBeInTheDocument();
  });

  it("keeps the empty first viewport action-oriented without stacked intro blocks (TB-1449)", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitectureDraftListClient />);

    expect(screen.getByTestId("architecture-draft-list-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create architecture" })).toBeInTheDocument();
  });

  it("shows draft-vs-review disclosure only when drafts exist (TB-1449)", async () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "a1" })]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-disclosure")).toBeInTheDocument();
    });
  });

  it("keeps search, filters, and sort in one toolbar", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "a1" })]);

    render(<ArchitectureDraftListClient />);

    const toolbar = screen.getByTestId("architecture-draft-list-toolbar");

    expect(within(toolbar).getByTestId("architecture-draft-list-search")).toBeInTheDocument();
    expect(within(toolbar).getByTestId("architecture-draft-list-sort")).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: /Filter architectures: All/ })).toBeInTheDocument();
  });

  it("filters by chip without changing registry counts", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      entry({ architectureId: "a1", customerStatus: "draft", displayName: "Draft A" }),
      entry({ architectureId: "a2", customerStatus: "ready-for-review", displayName: "Ready B" }),
    ]);

    render(<ArchitectureDraftListClient />);

    expect(screen.getByText("Draft A")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filter architectures: Draft (1)" }));

    expect(screen.getByText("Draft A")).toBeInTheDocument();
    expect(screen.queryByText("Ready B")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter architectures: All (2)" })).toBeInTheDocument();
  });
});
