import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

import { ArchitectureDraftListClient } from "./ArchitectureDraftListClient";

const architectureHubSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyHref(href: string): void {
      try {
        const url = new URL(href, "http://localhost/");
        state.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
      } catch {
        const qIndex = href.indexOf("?");
        state.query = qIndex >= 0 ? href.slice(qIndex + 1) : "";
      }

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "";
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: (href: string) => {
      architectureHubSearchParamsHarness.applyHref(href);
    },
  }),
  usePathname: () => "/architecture/architectures",
  useSearchParams: () => new URLSearchParams(architectureHubSearchParamsHarness.state.query),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  getDraftRequest: vi.fn(),
  reopenDraftRequest: vi.fn(),
}));

const useArchitectureDraftListQueryMock = vi.fn();
const useArchitectureIdentitiesListQueryMock = vi.fn();

vi.mock("@/hooks/use-architecture-draft-list-query", () => ({
  useArchitectureDraftListQuery: () => useArchitectureDraftListQueryMock(),
  selectArchitectureDraftRegistryEntries: (query: { data?: readonly ArchitectureDraftRegistryEntry[] }) =>
    query.data ?? [],
}));

vi.mock("@/hooks/use-architecture-identities-list-query", () => ({
  useArchitectureIdentitiesListQuery: () => useArchitectureIdentitiesListQueryMock(),
}));

const operatorScopeRecordHarness = vi.hoisted(() => ({
  record: {
    workspaceId: "workspace-1",
    projectId: "project-1",
    tenantId: "tenant-1",
    workspaceLabel: "Default workspace",
    projectLabel: "Default project",
  } as const,
}));

vi.mock("@/hooks/use-operator-scope-record", () => ({
  useOperatorScopeRecord: () => operatorScopeRecordHarness.record,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "architecture" as const }),
}));

function entry(
  overrides: Partial<ArchitectureDraftRegistryEntry> & Pick<ArchitectureDraftRegistryEntry, "draftId">,
): ArchitectureDraftRegistryEntry {
  return {
    draftId: overrides.draftId,
    displayName: overrides.displayName ?? "Healthcare Claims Platform",
    customerStatus: overrides.customerStatus ?? "ready-for-review",
    ownerLabel: overrides.ownerLabel ?? "You",
    lastUpdatedUtc: overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
    linkedReviewId: overrides.linkedReviewId ?? null,
    serverUpdatedUtc: overrides.serverUpdatedUtc ?? overrides.lastUpdatedUtc ?? "2026-07-12T23:42:05.000Z",
  };
}

describe("ArchitectureDraftListClient", () => {
  function SearchParamsRerenderHost({ children }: { readonly children: ReactNode }): ReactElement {
    useSyncExternalStore(
      architectureHubSearchParamsHarness.subscribe,
      () => architectureHubSearchParamsHarness.state.query,
      () => "",
    );

    return <>{children}</>;
  }

  function renderClient(searchQuery = "") {
    architectureHubSearchParamsHarness.state.query = searchQuery;

    return render(
      <SearchParamsRerenderHost>
        <ArchitectureDraftListClient />
      </SearchParamsRerenderHost>,
    );
  }

  function mockDraftList(entries: readonly ArchitectureDraftRegistryEntry[], isFetched = true) {
    useArchitectureDraftListQueryMock.mockReturnValue({
      data: entries,
      isFetched,
      isError: false,
      failure: null,
      blockedReason: null,
    });
  }

  beforeEach(() => {
    architectureHubSearchParamsHarness.reset();
    operatorScopeRecordHarness.record = {
      workspaceId: "workspace-1",
      projectId: "project-1",
      tenantId: "tenant-1",
      workspaceLabel: "Default workspace",
      projectLabel: "Default project",
    };
    useArchitectureDraftListQueryMock.mockReset();
    useArchitectureIdentitiesListQueryMock.mockReset();
    useArchitectureIdentitiesListQueryMock.mockReturnValue({
      data: { items: [] },
      isFetched: true,
    });
    mockDraftList([]);
  });

  it("counts abandoned drafts under Archived only, not No review yet", () => {
    mockDraftList([
      entry({ draftId: "a1", customerStatus: "archived", linkedReviewId: null, displayName: "Deleted A" }),
      entry({ draftId: "a2", customerStatus: "archived", linkedReviewId: null, displayName: "Deleted B" }),
    ]);

    renderClient();

    expect(screen.getByRole("link", { name: "Filter architectures: All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter architectures: No review yet (0)" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Filter architectures: Archived (2)" })).toBeInTheDocument();
    expect(screen.queryByText("No drafts match your filters")).not.toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list-table")).not.toBeInTheDocument();
  });

  it("uses URL-bound sort chips in the inventory toolbar", () => {
    mockDraftList([entry({ draftId: "a1" })]);

    renderClient();

    expect(screen.getByTestId("architecture-draft-list-sort-updated-desc")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("group", { name: "Sort architectures" })).toBeInTheDocument();
  });

  it("shows filter chip counts from the full registry", () => {
    mockDraftList([
      entry({ draftId: "a1", customerStatus: "draft", linkedReviewId: null }),
      entry({ draftId: "a2", customerStatus: "ready-for-review", linkedReviewId: null }),
      entry({ draftId: "a3",
        customerStatus: "archived",
        linkedReviewId: "run-1",
        displayName: "Archived platform",
      }),
    ]);

    renderClient();

    expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Filter architectures: All" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Filter architectures: Architecture draft (1)" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Filter architectures: Ready for review (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Filter architectures: No review yet (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Filter architectures: Archived (1)" })).toBeInTheDocument();
  });

  it("renders ready-for-review with in-progress status semantics and hybrid updated time", () => {
    mockDraftList([
      entry({ draftId: "a1",
        displayName: "Healthcare Claims Platform",
        customerStatus: "ready-for-review",
        lastUpdatedUtc: "2026-07-12T23:42:05.000Z",
      }),
    ]);

    renderClient();

    expect(screen.getByText("Healthcare Claims Platform")).toBeInTheDocument();

    const row = screen.getByTestId("architecture-draft-row-a1");
    const status = within(row).getByText("Ready for review");

    expect(status.className).toMatch(/al-tag-in-progress|al-accent-interactive/i);

    const updated = row.querySelector("time");

    expect(updated).not.toBeNull();
    expect(updated?.getAttribute("dateTime")).toBe("2026-07-12T23:42:05.000Z");
    expect(updated?.textContent ?? "").not.toMatch(/^Updated /);
    expect(screen.getByRole("button", { name: "Continue editing Healthcare Claims Platform" })).toBeInTheDocument();
  });

  it("shows a loading skeleton before registry hydrate (TB-1450)", () => {
    mockDraftList([], false);

    renderClient();

    expect(screen.getByTestId("architecture-draft-list-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-list-empty")).not.toBeInTheDocument();
  });

  it("does not flash the empty state before registry hydrate when drafts exist (TB-1450)", () => {
    mockDraftList([entry({ draftId: "a1" })]);

    renderClient();

    expect(screen.queryByTestId("architecture-draft-list-empty")).not.toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-list")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-list-table")).toBeInTheDocument();
  });

  it("keeps the empty first viewport action-oriented without stacked intro blocks (TB-1449)", () => {
    operatorScopeRecordHarness.record = null;
    mockDraftList([]);

    renderClient();

    expect(screen.getByTestId("architecture-draft-list-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-guidance-disclosure")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create architecture" })).toBeInTheDocument();
  });

  it("uses compact inventory toolbar search height", () => {
    mockDraftList([entry({ draftId: "a1" })]);

    renderClient();

    expect(screen.getByTestId("architecture-draft-list-search").className).toContain("h-8");
  });

  it("uses compact inventory toolbar sort chips", () => {
    mockDraftList([entry({ draftId: "a1" })]);

    renderClient();

    expect(screen.getByTestId("architecture-draft-list-sort-updated-desc")).toBeInTheDocument();
  });

  it("excludes archived drafts from the default All table view", () => {
    mockDraftList([
      entry({ draftId: "a1", customerStatus: "draft", displayName: "Draft A" }),
      entry({ draftId: "a2", customerStatus: "archived", displayName: "Archived B" }),
    ]);

    renderClient();

    const table = screen.getByTestId("architecture-draft-list-table");

    expect(within(table).getByText("Draft A")).toBeInTheDocument();
    expect(within(table).queryByText("Archived B")).not.toBeInTheDocument();
  });

  it("keeps search, filters, and sort in one toolbar", () => {
    mockDraftList([entry({ draftId: "a1" })]);

    renderClient();

    const toolbar = screen.getByTestId("architecture-draft-list-toolbar");

    expect(within(toolbar).getByTestId("architecture-draft-list-search")).toBeInTheDocument();
    expect(within(toolbar).getByTestId("architecture-draft-list-sort-updated-desc")).toBeInTheDocument();
    expect(within(toolbar).getByRole("link", { name: /Filter architectures: All/ })).toBeInTheDocument();
  });

  it("filters by chip without changing registry counts", () => {
    mockDraftList([
      entry({ draftId: "a1", customerStatus: "draft", displayName: "Draft A" }),
      entry({ draftId: "a2", customerStatus: "ready-for-review", displayName: "Ready B" }),
    ]);

    renderClient("filter=draft");

    const table = screen.getByTestId("architecture-draft-list-table");

    expect(within(table).getByText("Draft A")).toBeInTheDocument();
    expect(within(table).queryByText("Ready B")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Filter architectures: All" })).toBeInTheDocument();
  });

  it("pins continue last draft when session remembers an architecture id", () => {
    window.sessionStorage.setItem("archlucid.architecture-creation.draft-id", "a1");
    mockDraftList([
      entry({ draftId: "a1", customerStatus: "draft", displayName: "Draft A" }),
      entry({ draftId: "a2", customerStatus: "draft", displayName: "Draft B" }),
    ]);

    renderClient();

    expect(screen.getByTestId("architecture-draft-continue-last-row")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-continue-last-open")).toHaveAttribute(
      "href",
      "/architecture/architectures/a1",
    );
  });

  it("hides continue last draft when the remembered draft is archived", () => {
    window.sessionStorage.setItem("archlucid.architecture-creation.draft-id", "a1");
    mockDraftList([
      entry({ draftId: "a1", customerStatus: "archived", displayName: "Archived A" }),
    ]);

    renderClient();

    expect(screen.queryByTestId("architecture-draft-continue-last-row")).not.toBeInTheDocument();
  });
});
