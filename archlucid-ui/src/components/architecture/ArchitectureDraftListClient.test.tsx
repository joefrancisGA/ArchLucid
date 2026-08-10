import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture-draft-registry";
import { ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY } from "@/lib/architecture-draft-guidance-dismiss";

const listArchitectureDraftRegistryEntries = vi.fn();

vi.mock("@/lib/architecture-draft-registry", async () => {
  const actual = await vi.importActual<typeof import("@/lib/architecture-draft-registry")>(
    "@/lib/architecture-draft-registry",
  );

  return {
    ...actual,
    listArchitectureDraftRegistryEntries: () => listArchitectureDraftRegistryEntries(),
  };
});

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
    listArchitectureDraftRegistryEntries.mockReset();
    window.localStorage.removeItem(ARCHITECTURE_DRAFT_GUIDANCE_DISMISS_STORAGE_KEY);
  });

  it("shows filter chip counts from the full registry", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
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

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();
    });

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

  it("renders ready-for-review with in-progress status semantics and hybrid updated time", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      entry({
        architectureId: "a1",
        displayName: "Healthcare Claims Platform",
        customerStatus: "ready-for-review",
        lastUpdatedUtc: "2026-07-12T23:42:05.000Z",
      }),
    ]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByText("Healthcare Claims Platform")).toBeInTheDocument();
    });

    const row = screen.getByTestId("architecture-draft-row-a1");
    const status = within(row).getByText("Ready for review");

    expect(status.className).toMatch(/sky/i);

    const updated = within(row).getByText(/Updated/i);

    expect(updated.getAttribute("title")).toMatch(/2026/);
    expect(updated.textContent ?? "").toMatch(/Updated .+ · /);
  });

  it("keeps the empty first viewport action-oriented without stacked intro blocks (TB-1449)", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-list-empty")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list-scope-note")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create architecture" })).toBeInTheDocument();
  });

  it("shows draft-vs-review disclosure only when drafts exist (TB-1449)", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "a1" })]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-guidance-disclosure")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("architecture-draft-list-scope-note")).not.toBeInTheDocument();
  });

  it("keeps search, filters, and sort in one toolbar", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "a1" })]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-list-toolbar")).toBeInTheDocument();
    });

    const toolbar = screen.getByTestId("architecture-draft-list-toolbar");

    expect(within(toolbar).getByTestId("architecture-draft-list-search")).toBeInTheDocument();
    expect(within(toolbar).getByTestId("architecture-draft-list-sort")).toBeInTheDocument();
    expect(within(toolbar).getByRole("button", { name: /Filter architectures: All/ })).toBeInTheDocument();
  });

  it("filters by chip without changing registry counts", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([
      entry({ architectureId: "a1", customerStatus: "draft", displayName: "Draft A" }),
      entry({ architectureId: "a2", customerStatus: "ready-for-review", displayName: "Ready B" }),
    ]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByText("Draft A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Filter architectures: Draft (1)" }));

    expect(screen.getByText("Draft A")).toBeInTheDocument();
    expect(screen.queryByText("Ready B")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter architectures: All (2)" })).toBeInTheDocument();
  });
});
