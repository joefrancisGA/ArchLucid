import { fireEvent, render, screen, within } from "@testing-library/react";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runsListSearchParamsHarness = vi.hoisted(() => {
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

const runsListWorkspaceModeHarness = vi.hoisted(() => ({
  mode: "working" as "working" | "guided",
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(runsListSearchParamsHarness.state.query),
    usePathname: () => "/architecture/reviews",
    useRouter: () => ({
      replace: (href: string) => {
        runsListSearchParamsHarness.applyHref(href);
      },
      push: vi.fn(),
    }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => ({
      mode: runsListWorkspaceModeHarness.mode,
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: runsListWorkspaceModeHarness.mode === "working",
      setAndPersist: vi.fn(),
    }),
  };
});

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

vi.mock("@/components/runs/RunStatusBadge", () => ({
  RunStatusBadge: () => null,
}));

import { RunsListClient } from "./RunsListClient";

import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import type { RunSummary } from "@/types/authority";

beforeEach(() => {
  buyerPolishedShellVitestOverride.value = false;
  runsListWorkspaceModeHarness.mode = "working";
  runsListSearchParamsHarness.reset();
});

afterEach(() => {
  buyerPolishedShellVitestOverride.value = null;
});

const sampleRun: RunSummary = {
  runId: "00000000-0000-0000-0000-000000000099",
  projectId: "default",
  description: "Demo",
  createdUtc: "2026-01-15T12:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: false,
  hasFindingsSnapshot: true,
  hasGoldenManifest: false,
};

function RunsListSearchParamsRerenderHost({ children }: { readonly children: ReactNode }): ReactElement {
  useSyncExternalStore(
    runsListSearchParamsHarness.subscribe,
    () => runsListSearchParamsHarness.state.query,
    () => "",
  );

  return <>{children}</>;
}

function renderRunsList(ui: ReactElement, searchQuery = "") {
  runsListSearchParamsHarness.state.query = searchQuery;

  return render(<RunsListSearchParamsRerenderHost>{ui}</RunsListSearchParamsRerenderHost>);
}

describe("RunsListClient inspector", () => {
  it("collapses showcase alias + canonical rows into one table row (unique data-testid)", () => {
    const aliasRun: RunSummary = {
      runId: "customer-intake-modernization-run",
      projectId: "default",
      description: "Claims Intake Modernization",
      createdUtc: "2026-01-10T14:15:22.000Z",
      hasContextSnapshot: true,
      hasGraphSnapshot: true,
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const canonicalRun: RunSummary = {
      ...aliasRun,
      runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    };

    render(
      <RunsListClient runs={[aliasRun, canonicalRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );

    expect(screen.getAllByTestId(`runs-row-${SHOWCASE_STATIC_DEMO_RUN_ID}`)).toHaveLength(1);
  });

  it("keeps the inspector empty until a row is selected", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );

    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();

    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));

    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
  });

  it("opens inspector preview when a row is clicked (not the Open review link)", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    const preview = screen.getByTestId("run-inspector-preview");
    expect(preview).toBeInTheDocument();
    fireEvent.click(within(preview).getByRole("button", { name: /technical details \(ids\)/i }));
    expect(within(preview).getByText("Workspace")).toBeInTheDocument();
  });

  it("closes inspector when X is clicked", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("inspector-panel-close"));
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
  });

  it("closes inspector on Escape after selection", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
  });

  it("shows work-queue section for needs-attention runs", () => {
    render(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
    );
    expect(screen.getByRole("heading", { name: /needs attention/i })).toBeInTheDocument();
    expect(within(screen.getByTestId(`runs-row-${sampleRun.runId}`)).getByTestId("run-provenance-inline")).toBeInTheDocument();
  });

  it("renders primary title as Untitled review when description is empty", () => {
    const untitled: RunSummary = {
      ...sampleRun,
      description: "   ",
    };
    render(<RunsListClient runs={[untitled]} projectId="default" page={1} pageSize={20} totalCount={1} />);
    expect(within(screen.getByTestId(`runs-row-${untitled.runId}`)).getByText("Untitled review")).toBeInTheDocument();
  });

  it("partitions multiple runs into ordered queue sections", () => {
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-000000000001",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const inProgress: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-000000000002",
      hasFindingsSnapshot: false,
      hasGoldenManifest: false,
      hasGraphSnapshot: true,
    };

    render(
      <RunsListClient runs={[committed, sampleRun, inProgress]} projectId="default" page={1} pageSize={20} totalCount={3} />,
    );

    expect(screen.getByRole("heading", { name: /needs attention/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^in progress$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^finalized$/i })).toBeInTheDocument();
  });

  it("shows Set as baseline menu only for committed runs", () => {
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000aa",
      hasGoldenManifest: true,
    };

    render(<RunsListClient runs={[sampleRun, committed]} projectId="default" page={1} pageSize={20} totalCount={2} />);

    expect(screen.queryByTestId(`runs-row-baseline-menu-${sampleRun.runId}`)).toBeNull();
    expect(screen.getByTestId(`runs-row-baseline-menu-${committed.runId}`)).toBeInTheDocument();
  });

  it("does not open inspector when Space activates a compare checkbox", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    const checkbox = within(screen.getByTestId(`runs-row-${sampleRun.runId}`)).getByRole("checkbox");

    fireEvent.keyDown(checkbox, { key: " ", code: "Space" });

    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
  });

  it("buyer-polished: clears stale compareRuns from the URL when buyer package cards hide compare UI", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const committed2: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cf",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[committed, committed2]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      `compareRuns=${committed.runId},${committed2.runId}`,
    );

    expect(screen.queryByTestId("runs-list-compare-selection-bar")).toBeNull();
    expect(runsListSearchParamsHarness.state.query).not.toContain("compareRuns=");
  });

  it("buyer-polished: uses finalized section heading and scope chips", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const committed2: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cf",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[committed, committed2]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    expect(screen.getByRole("heading", { name: /finalized architecture reviews/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /show:\s*finalized packages/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Search reviews by title or description/i)).toBeInTheDocument();
  });

  it("buyer-polished: hides list filters when exactly one review exists", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    render(<RunsListClient runs={[committed]} projectId="default" page={1} pageSize={20} totalCount={1} />);

    expect(screen.queryByLabelText(/Search reviews by title or description/i)).toBeNull();
  });

  it("narrows text filter closes inspector when selected run is filtered out", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();

    const filterInput = screen.getByLabelText(/Filter reviews by name or description/i);
    fireEvent.change(filterInput, { target: { value: "Second" } });

    expect(screen.queryByTestId(`runs-row-${sampleRun.runId}`)).toBeNull();
    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
  });

  it("buyer-polished: finalized scope hides in-flight runs", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const inFlight: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000dd",
    };
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000ee",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[inFlight, committed]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      "scope=finalized",
    );

    expect(screen.queryByTestId(`runs-row-${inFlight.runId}`)).toBeNull();
    expect(screen.getByTestId(`runs-row-${committed.runId}`)).toBeInTheDocument();
  });

  it("buyer-polished: card layout opens inspector preview when the card shell is activated", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    render(<RunsListClient runs={[committed]} projectId="default" page={1} pageSize={20} totalCount={1} />);

    fireEvent.click(screen.getByTestId(`runs-row-${committed.runId}`));

    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
  });

  it("does not open inspector when Space activates the baseline menu summary", () => {
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000aa",
      hasGoldenManifest: true,
    };

    render(<RunsListClient runs={[committed]} projectId="default" page={1} pageSize={20} totalCount={1} />);

    const menu = screen.getByTestId(`runs-row-baseline-menu-${committed.runId}`);
    const summary = within(menu).getByText("More");

    fireEvent.keyDown(summary, { key: " ", code: "Space" });

    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
  });

  it("buyer-polished: Space on the featured card CTA does not open the inspector", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const committed2: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cf",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[committed, committed2]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    const cta = screen.getByTestId(`runs-row-primary-explore-${committed.runId}`);

    fireEvent.keyDown(cta, { key: " ", code: "Space" });

    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
  });

  it("filters reviews by displayName when the visible title differs from description", () => {
    const displayTitledRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000aa",
      displayName: "Q3 Platform Architecture",
      description: "",
    };
    const otherRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Other review",
    };

    render(
      <RunsListClient
        runs={[displayTitledRun, otherRun]}
        projectId="default"
        page={1}
        pageSize={20}
        totalCount={2}
      />,
    );

    const filterInput = screen.getByLabelText(/Filter reviews by name or description/i);
    fireEvent.change(filterInput, { target: { value: "Platform Architecture" } });

    expect(screen.getByTestId(`runs-row-${displayTitledRun.runId}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`runs-row-${otherRun.runId}`)).toBeNull();
  });

  it("clears inspectorRunId from the URL when text filter closes the inspector", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    renderRunsList(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      `inspectorRunId=${sampleRun.runId}`,
    );

    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();

    const filterInput = screen.getByLabelText(/Filter reviews by name or description/i);
    fireEvent.change(filterInput, { target: { value: "Second" } });

    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
    expect(runsListSearchParamsHarness.state.query).not.toContain("inspectorRunId=");
  });

  it("buyer-polished: scope filter closes inspector when the selected run is hidden", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const inFlight: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000dd",
    };
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000ee",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[inFlight, committed]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      `inspectorRunId=${inFlight.runId}&scope=finalized`,
    );

    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
    expect(runsListSearchParamsHarness.state.query).not.toContain("inspectorRunId=");
  });

  it("keeps compareRuns selection when text filter hides one selected row", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    renderRunsList(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      `compareRuns=${sampleRun.runId},${secondRun.runId}`,
    );

    expect(screen.getByTestId("runs-list-compare-selection-bar")).toBeInTheDocument();

    const filterInput = screen.getByLabelText(/Filter reviews by name or description/i);
    fireEvent.change(filterInput, { target: { value: "Second" } });

    expect(screen.queryByTestId(`runs-row-${sampleRun.runId}`)).toBeNull();
    expect(screen.getByTestId("runs-list-compare-selection-bar")).toBeInTheDocument();
    expect(runsListSearchParamsHarness.state.query).toContain(`compareRuns=${sampleRun.runId}`);
  });

  it("buyer-polished: inspectorRunId deep link opens inspector on card layout", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };
    const committed2: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cf",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[committed, committed2]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      `inspectorRunId=${committed.runId}`,
    );

    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
  });

  it("shows orphan-candidates context banner when filter=orphan-candidates is in the URL", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    renderRunsList(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      "filter=orphan-candidates",
    );

    expect(screen.getByTestId("runs-list-orphan-candidates-filter-banner")).toBeInTheDocument();
    expect(screen.getByText(/orphan-candidates\.json/i)).toBeInTheDocument();
  });

  it("shows an empty-table message when the text filter matches no reviews", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    fireEvent.change(screen.getByLabelText(/Filter reviews by name or description/i), {
      target: { value: "nomatch-xyz-123" },
    });

    expect(screen.getByText("No reviews match this filter.")).toBeInTheDocument();
  });

  it("exposes oldest-first sort as a link with created-asc in the href", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    const oldestFirst = screen.getByTestId("runs-list-sort-created-asc");

    expect(oldestFirst).toHaveAttribute("href", expect.stringContaining("sort=created-asc"));
  });

  it("renders a Next pagination link when more pages exist", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient
        runs={[sampleRun, secondRun]}
        projectId="default"
        page={1}
        pageSize={20}
        totalCount={40}
        nextCursor="cursor-page-2"
      />,
    );

    const nextLink = screen.getByRole("link", { name: "Next" });

    expect(nextLink).toHaveAttribute("href", expect.stringContaining("page=2"));
    expect(nextLink).toHaveAttribute("href", expect.stringContaining("cursor=cursor-page-2"));
  });

  it("updates the filter status line when the text filter narrows the page", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    expect(screen.getByText("2 reviews on this page.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Filter reviews by name or description/i), {
      target: { value: "Demo" },
    });

    expect(screen.getByText("Showing 1 of 2 on this page (matches filter)")).toBeInTheDocument();
  });

  it("Escape in the filter field clears the query without closing an open inspector", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    fireEvent.click(screen.getByTestId(`runs-row-${sampleRun.runId}`));
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();

    const filterInput = screen.getByLabelText(/Filter reviews by name or description/i);
    fireEvent.change(filterInput, { target: { value: "Demo" } });
    fireEvent.keyDown(filterInput, { key: "Escape", code: "Escape" });

    expect(filterInput).toHaveValue("");
    expect(screen.getByTestId("run-inspector-preview")).toBeInTheDocument();
  });

  it("buyer-polished: in_flight scope hides finalized package rows", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const inFlight: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000dd",
    };
    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000ee",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
    };

    renderRunsList(
      <RunsListClient runs={[inFlight, committed]} projectId="default" page={1} pageSize={20} totalCount={2} />,
      "scope=in_flight",
    );

    expect(screen.getByTestId(`runs-row-${inFlight.runId}`)).toBeInTheDocument();
    expect(screen.queryByTestId(`runs-row-${committed.runId}`)).toBeNull();
  });

  it("debounces text filter into the q= URL search param", async () => {
    vi.useFakeTimers();

    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    render(
      <RunsListClient runs={[sampleRun, secondRun]} projectId="default" page={1} pageSize={20} totalCount={2} />,
    );

    fireEvent.change(screen.getByLabelText(/Filter reviews by name or description/i), {
      target: { value: "Demo" },
    });

    expect(runsListSearchParamsHarness.state.query).not.toContain("q=Demo");

    await vi.advanceTimersByTimeAsync(300);

    expect(runsListSearchParamsHarness.state.query).toContain("q=Demo");

    vi.useRealTimers();
  });

  it("shows a replacement notice when a third compare checkbox is selected", () => {
    const runB: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };
    const runC: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      description: "Third review",
    };

    render(
      <RunsListClient runs={[sampleRun, runB, runC]} projectId="default" page={1} pageSize={20} totalCount={3} />,
    );

    fireEvent.click(within(screen.getByTestId(`runs-row-${sampleRun.runId}`)).getByRole("checkbox"));
    fireEvent.click(within(screen.getByTestId(`runs-row-${runB.runId}`)).getByRole("checkbox"));
    fireEvent.click(within(screen.getByTestId(`runs-row-${runC.runId}`)).getByRole("checkbox"));

    expect(
      screen.getByText(/only two reviews can be compared/i),
    ).toBeInTheDocument();
    expect(runsListSearchParamsHarness.state.query).toContain(`compareRuns=${runB.runId}`);
    expect(runsListSearchParamsHarness.state.query).toContain(runC.runId);
    expect(runsListSearchParamsHarness.state.query).not.toContain(sampleRun.runId);
  });

  it("buyer-polished: active text filter switches from card layout to the work-queue table", () => {
    buyerPolishedShellVitestOverride.value = true;
    runsListWorkspaceModeHarness.mode = "guided";

    const committed: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cc",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      description: "Alpha package",
    };
    const committed2: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000cf",
      hasFindingsSnapshot: true,
      hasGoldenManifest: true,
      description: "Beta package",
    };

    render(<RunsListClient runs={[committed, committed2]} projectId="default" page={1} pageSize={20} totalCount={2} />);

    expect(screen.getByRole("heading", { name: /finalized architecture reviews/i })).toBeInTheDocument();
    expect(screen.queryByTestId("runs-queue-committed")).toBeNull();

    fireEvent.change(screen.getByLabelText(/Search reviews by title or description/i), {
      target: { value: "Alpha" },
    });

    expect(screen.queryByRole("heading", { name: /finalized architecture reviews/i })).toBeNull();
    expect(screen.getByTestId("runs-queue-committed")).toBeInTheDocument();
  });

  it("keeps the inspector empty when inspectorRunId does not match a row on the page", () => {
    renderRunsList(
      <RunsListClient runs={[sampleRun]} projectId="default" page={1} pageSize={20} totalCount={1} />,
      "inspectorRunId=00000000-0000-0000-0000-00000000009999",
    );

    expect(screen.getByTestId("run-inspector-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("run-inspector-preview")).toBeNull();
  });

  it("preserves q= and sort= in the Next pagination link", () => {
    const secondRun: RunSummary = {
      ...sampleRun,
      runId: "00000000-0000-0000-0000-0000000000bb",
      description: "Second review",
    };

    renderRunsList(
      <RunsListClient
        runs={[sampleRun, secondRun]}
        projectId="default"
        page={1}
        pageSize={20}
        totalCount={40}
        nextCursor="cursor-page-2"
      />,
      "q=Demo&sort=created-asc",
    );

    const nextLink = screen.getByRole("link", { name: "Next" });

    expect(nextLink).toHaveAttribute("href", expect.stringContaining("q=Demo"));
    expect(nextLink).toHaveAttribute("href", expect.stringContaining("sort=created-asc"));
    expect(nextLink).toHaveAttribute("href", expect.stringContaining("page=2"));
    expect(nextLink).toHaveAttribute("href", expect.stringContaining("cursor=cursor-page-2"));
  });
});
