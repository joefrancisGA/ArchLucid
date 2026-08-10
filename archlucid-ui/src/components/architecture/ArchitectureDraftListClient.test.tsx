import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureDraftListClient } from "@/components/architecture/ArchitectureDraftListClient";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture-draft-registry";

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

  it("shows browser-local scope honesty when the registry is empty", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-list-empty")).toBeInTheDocument();
    });

    expect(screen.getByText(/this browser/i)).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list-scope-note")).not.toBeInTheDocument();
  });

  it("shows browser-local scope honesty above the list when drafts exist", async () => {
    listArchitectureDraftRegistryEntries.mockReturnValue([entry({ architectureId: "a1" })]);

    render(<ArchitectureDraftListClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-draft-list-scope-note")).toBeInTheDocument();
    });

    expect(screen.getByTestId("architecture-draft-list-scope-note").textContent?.toLowerCase()).toContain(
      "this browser",
    );
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
