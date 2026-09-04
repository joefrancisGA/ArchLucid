import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunSummary } from "@/types/authority";
import { writeArchivedReviewsClientCache } from "@/lib/archived-reviews-client-cache";
import { writeFavoriteReviews } from "@/lib/favorite-reviews";

const useArchitectureDraftRegistryEntries = vi.fn();
const readOperatorScopeFromStorage = vi.fn();
const useSearchParams = vi.fn();
const useRouter = vi.fn();
const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: false }));
const inFlightOperationsMock = vi.hoisted(() => [] as readonly unknown[]);
const liveShellRecoveryMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () => inFlightOperationsMock,
}));

vi.mock("@/lib/live-operator-shell-recovery", () => ({
  isLiveOperatorShellRecoveryContext: () => liveShellRecoveryMock.value,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => useSearchParams(),
  useRouter: () => useRouter(),
}));

vi.mock("@/components/reviews/ReviewArchiveControl", () => ({
  ReviewArchiveControl: () => <button type="button">Archive review</button>,
}));

vi.mock("./ReviewsHubInventoryRowActions", () => ({
  ReviewsHubInventoryRowActions: ({
    row,
  }: {
    row: { runId: string; primaryAction: { label: string; href: string } };
  }) => (
    <a href={row.primaryAction.href} data-testid={`reviews-hub-open-${row.runId}`}>
      {row.primaryAction.label}
    </a>
  ),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      name: "Taylor Morgan",
      provenance: "auth-me",
      roleClaimValues: [],
      primaryAppRole: "Operator",
      maxAuthority: "ExecuteAuthority",
      authorityRank: 2,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: false,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
    isAuthorityLoading: false,
    callerAuthorityRank: 2,
  }),
}));

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => useArchitectureDraftRegistryEntries(),
}));

vi.mock("@/lib/operator/operator-scope-storage", async () => {
  const actual = await vi.importActual<typeof import("@/lib/operator/operator-scope-storage")>(
    "@/lib/operator/operator-scope-storage",
  );

  return {
    ...actual,
    readOperatorScopeFromStorage: () => readOperatorScopeFromStorage(),
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ReviewsHubReviewInventory } from "./ReviewsHubReviewInventory";
import { deriveReviewsWorkspaceSummary } from "./reviews-workspace-summary";

function emptySummary() {
  return deriveReviewsWorkspaceSummary([]);
}

beforeEach(() => {
  window.localStorage.clear();
  useArchitectureDraftRegistryEntries.mockReset();
  useArchitectureDraftRegistryEntries.mockReturnValue([]);
  readOperatorScopeFromStorage.mockReset();
  readOperatorScopeFromStorage.mockReturnValue(null);
  useSearchParams.mockReset();
  useSearchParams.mockReturnValue(new URLSearchParams());
  useRouter.mockReset();
  useRouter.mockReturnValue({ replace: vi.fn() });
  workspaceModeMock.isWorkingMode = false;
  inFlightOperationsMock.length = 0;
  liveShellRecoveryMock.value = false;
});

describe("ReviewsHubReviewInventory", () => {
  it("renders a rich empty state with start and sample actions when no drafts exist", () => {
    render(<ReviewsHubReviewInventory runs={[]} summary={emptySummary()} />);

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-recent-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveClass("border-neutral-300");
    expect(screen.getByRole("link", { name: "Explore the sample review" })).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty-help-link")).not.toBeInTheDocument();
    expect(screen.queryByTestId("workspace-scope-empty-teaching")).not.toBeInTheDocument();
  });

  it("teaches workspace/project switcher when empty under a specific scope selection", () => {
    readOperatorScopeFromStorage.mockReturnValue({
      tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      workspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      projectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      workspaceLabel: "Acme Workspace",
      projectLabel: "Payments",
    });

    render(<ReviewsHubReviewInventory runs={[]} summary={emptySummary()} />);

    expect(screen.getByTestId("workspace-scope-empty-teaching")).toBeInTheDocument();
    expect(screen.getByText("No reviews in Payments")).toBeInTheDocument();
    expect(screen.getByText("Switch workspace/project to see other work.")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty")).not.toBeInTheDocument();
  });

  it("keeps rich empty CTAs when drafts exist", () => {
    useArchitectureDraftRegistryEntries.mockReturnValue([
      {
        architectureId: "draft-001",
        displayName: "Payments platform draft",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-01-15T12:00:00.000Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-01-15T12:00:00.000Z",
      },
    ]);

    render(<ReviewsHubReviewInventory runs={[]} summary={emptySummary()} />);

    expect(screen.getByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByText(/Continue the draft from the header/i)).toBeInTheDocument();
    expect(screen.getByText(/start a review from a description or imported documents/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start an architecture review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
    expect(screen.getByRole("link", { name: "Explore the sample review" })).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-recent-empty-help-link")).not.toBeInTheDocument();
  });

  it("renders review rows with governance, risks, and StatusTag", () => {
    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "review-001",
            projectId: "claims-intake",
            description: "Claims intake modernization",
            createdUtc: "2026-01-15T12:00:00.000Z",
            hasFindingsSnapshot: true,
            findingCount: 2,
          } satisfies RunSummary,
        ]}
        summary={deriveReviewsWorkspaceSummary([
          {
            runId: "review-001",
            projectId: "claims-intake",
            description: "Claims intake modernization",
            createdUtc: "2026-01-15T12:00:00.000Z",
            hasFindingsSnapshot: true,
            findingCount: 2,
          } satisfies RunSummary,
        ])}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Pinned" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Review" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Architecture" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Approval" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Risks" })).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-row-review-001")).toBeInTheDocument();
    expect(screen.getByText("Taylor Morgan")).toBeInTheDocument();
    const titleLink = screen.getByTestId("reviews-hub-primary-action-review-001");
    expect(titleLink).toHaveAttribute("href");
    expect(titleLink.className).toMatch(/underline/);
    expect(titleLink.className).not.toMatch(/no-underline/);
    expect(screen.getByTestId("reviews-hub-open-review-001")).toHaveTextContent("Review findings");
    expect(screen.queryByRole("columnheader", { name: "Action" })).toBeNull();
  });

  it("renders all review inventory filter chips inline without a more-filters disclosure", () => {
    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "review-001",
            projectId: "default",
            createdUtc: "2026-01-15T12:00:00.000Z",
          } satisfies RunSummary,
        ]}
        summary={emptySummary()}
      />,
    );

    expect(screen.queryByTestId("reviews-hub-more-filters")).toBeNull();
    expect(screen.getByRole("button", { name: /Filter reviews: Draft/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter reviews: Active/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter reviews: Awaiting approval/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter reviews: Archived/ })).toBeInTheDocument();
  });

  it("filters to finalized reviews from the primary FilterChip row", () => {
    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "draft",
            projectId: "default",
            createdUtc: "2026-01-15T12:00:00.000Z",
          } satisfies RunSummary,
          {
            runId: "finalized",
            projectId: "default",
            createdUtc: "2026-01-10T12:00:00.000Z",
            hasGoldenManifest: true,
          } satisfies RunSummary,
        ]}
        summary={deriveReviewsWorkspaceSummary([
          {
            runId: "draft",
            projectId: "default",
            createdUtc: "2026-01-15T12:00:00.000Z",
          } satisfies RunSummary,
          {
            runId: "finalized",
            projectId: "default",
            createdUtc: "2026-01-10T12:00:00.000Z",
            hasGoldenManifest: true,
          } satisfies RunSummary,
        ])}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Filter reviews: Finalized/ }));

    expect(screen.getByTestId("reviews-hub-row-finalized")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-row-draft")).toBeNull();
  });

  it("renders a pin toggle on each inventory row (TB-2206)", () => {
    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "run-pin-1",
            projectId: "default",
            createdUtc: "2026-08-10T12:00:00.000Z",
            displayName: "Pinned candidate",
          } satisfies RunSummary,
        ]}
        summary={emptySummary()}
      />,
    );

    expect(screen.getByTestId("favorite-review-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("favorite-review-toggle")).toHaveAttribute("data-run-id", "run-pin-1");
    expect(screen.getByTestId("favorite-review-toggle")).toHaveAttribute("data-favorited", "false");
    expect(screen.getByRole("columnheader", { name: "Pinned" })).toBeInTheDocument();
  });

  it("sorts pinned reviews to the top of the unified inventory table", () => {
    writeFavoriteReviews([
      { runId: "run-pinned", title: "Pinned package", pinnedAt: "2026-08-10T12:00:00.000Z" },
    ]);

    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "run-pinned",
            projectId: "default",
            description: "Pinned package",
            createdUtc: "2026-08-10T12:00:00.000Z",
          } satisfies RunSummary,
          {
            runId: "run-other",
            projectId: "default",
            description: "Other package",
            createdUtc: "2026-08-09T12:00:00.000Z",
          } satisfies RunSummary,
        ]}
        summary={deriveReviewsWorkspaceSummary([
          {
            runId: "run-pinned",
            projectId: "default",
            description: "Pinned package",
            createdUtc: "2026-08-10T12:00:00.000Z",
          } satisfies RunSummary,
          {
            runId: "run-other",
            projectId: "default",
            description: "Other package",
            createdUtc: "2026-08-09T12:00:00.000Z",
          } satisfies RunSummary,
        ])}
      />,
    );

    expect(screen.queryByTestId("reviews-hub-pinned-reviews")).toBeNull();
    expect(screen.queryByTestId("reviews-hub-pinned-packages-table")).toBeNull();
    expect(screen.getByTestId("reviews-hub-packages-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("reviews-hub-row-run-pinned")).toHaveLength(1);
    expect(screen.getAllByTestId("reviews-hub-row-run-other")).toHaveLength(1);
    const rows = screen.getAllByTestId(/^reviews-hub-row-/);
    expect(rows[0]).toHaveAttribute("data-testid", "reviews-hub-row-run-pinned");
  });

  it("hides archived reviews by default and shows them when the Archived filter is selected", () => {
    writeArchivedReviewsClientCache([
      {
        runId: "archived-review",
        projectId: "default",
        description: "Archived package",
        createdUtc: "2026-08-01T12:00:00.000Z",
        isArchived: true,
      } satisfies RunSummary,
    ]);

    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "active-review",
            projectId: "default",
            description: "Active package",
            createdUtc: "2026-08-10T12:00:00.000Z",
          } satisfies RunSummary,
        ]}
        summary={deriveReviewsWorkspaceSummary([
          {
            runId: "active-review",
            projectId: "default",
            description: "Active package",
            createdUtc: "2026-08-10T12:00:00.000Z",
          } satisfies RunSummary,
        ])}
      />,
    );

    expect(screen.queryByTestId("reviews-hub-row-archived-review")).toBeNull();
    expect(screen.getByTestId("reviews-hub-row-active-review")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Filter reviews: Archived/ }));

    expect(screen.getByTestId("reviews-hub-row-archived-review")).toBeInTheDocument();
    expect(screen.queryByTestId("reviews-hub-row-active-review")).toBeNull();
  });

  it("shows archived count on the Archived chip before the filter is selected", () => {
    writeArchivedReviewsClientCache([
      {
        runId: "archived-review",
        projectId: "default",
        description: "Archived package",
        createdUtc: "2026-08-01T12:00:00.000Z",
        isArchived: true,
      } satisfies RunSummary,
    ]);

    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "active-review",
            projectId: "default",
            description: "Active package",
            createdUtc: "2026-08-10T12:00:00.000Z",
          } satisfies RunSummary,
        ]}
        summary={emptySummary()}
      />,
    );

    expect(screen.getByRole("button", { name: "Filter reviews: Archived (1)" })).toBeInTheDocument();
  });

  it("shows a clear action when search filters out all reviews", () => {
    useSearchParams.mockReturnValue(new URLSearchParams("q=no-such-review"));

    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "review-001",
            projectId: "default",
            description: "Claims intake modernization",
            createdUtc: "2026-01-15T12:00:00.000Z",
          } satisfies RunSummary,
        ]}
        summary={emptySummary()}
      />,
    );

    expect(screen.queryByTestId("reviews-hub-search")).toBeNull();
    expect(screen.getByTestId("reviews-hub-inventory-empty")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-inventory-empty-clear")).toBeInTheDocument();
  });

  it("omits the sample explore CTA on live tenants", () => {
    liveShellRecoveryMock.value = true;

    render(<ReviewsHubReviewInventory runs={[]} summary={emptySummary()} />);

    expect(screen.getByRole("link", { name: "Start an architecture review" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Explore the sample review" })).toBeNull();
  });

  it("shows the in-flight analysis desk above the table in Working mode", () => {
    workspaceModeMock.isWorkingMode = true;
    inFlightOperationsMock.push({
      operationId: "run:in-flight-1",
      title: "Payments review",
      href: "/architecture/reviews/in-flight-1",
      startedAtMs: 1_700_000_000_000,
      stepLabel: "Queued",
      state: "Running",
      runId: "in-flight-1",
      architectureId: null,
      retainUntilConsumed: false,
      terminalToastShown: false,
    });

    render(
      <ReviewsHubReviewInventory
        runs={[
          {
            runId: "finalized-1",
            projectId: "default",
            createdUtc: "2026-01-10T12:00:00.000Z",
            hasGoldenManifest: true,
          } satisfies RunSummary,
          {
            runId: "in-flight-1",
            projectId: "default",
            createdUtc: "2026-01-15T12:00:00.000Z",
            hasFindingsSnapshot: true,
            findingCount: 1,
          } satisfies RunSummary,
        ]}
        summary={emptySummary()}
      />,
    );

    expect(screen.getByTestId("reviews-hub-in-flight-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("reviews-hub-in-flight-open-run:in-flight-1")).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=activity"),
    );

    const rows = screen.getAllByTestId(/^reviews-hub-row-/);

    expect(rows[0]).toHaveAttribute("data-testid", "reviews-hub-row-in-flight-1");
  });
});
