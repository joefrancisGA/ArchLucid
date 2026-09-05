import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import {
  OPERATOR_HOME_YOUR_WORK_COLUMN_NAME,
  OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS,
  OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE,
  OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED,
} from "@/lib/buyer/buyer-polish-copy";
import type { RunSummary } from "@/types/authority";

let mockDraftEntries: ArchitectureDraftRegistryEntry[] = [];

vi.mock("@/hooks/use-architecture-draft-registry-entries", () => ({
  useArchitectureDraftRegistryEntries: () => mockDraftEntries,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import {
  OperatorHomeWorkspaceActivityProvider,
  useOperatorHomeWorkspaceActivity,
} from "@/components/operator-home/operator-home-workspace-activity-context";

import { UnfinishedWorkRail } from "./UnfinishedWorkRail";

/** Stands in for the reviews panel reporting a refreshed list after header Refresh. */
function RunsReporter(props: { readonly runs: readonly RunSummary[] }): React.JSX.Element {
  const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

  return (
    <button type="button" onClick={() => reportWorkspaceReviews(props.runs, props.runs.length)}>
      Report refreshed reviews
    </button>
  );
}

describe("UnfinishedWorkRail (TB-2209)", () => {
  beforeEach(() => {
    mockDraftEntries = [];
  });

  it("hides draft-only continue rail when the hero owns resume", () => {
    mockDraftEntries = [
      {
        architectureId: "arch-1",
        displayName: "Payments edge",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-10T12:00:00Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-08-10T12:00:00Z",
      },
    ];

    const { container } = render(<UnfinishedWorkRail runs={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("still surfaces in-progress reviews when unlinked drafts also exist", () => {
    mockDraftEntries = [
      {
        architectureId: "arch-1",
        displayName: "Payments edge",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-10T12:00:00Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-08-10T12:00:00Z",
      },
    ];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews>
        <UnfinishedWorkRail runs={runs} />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("unfinished-work-rail")).toBeInTheDocument();
    expect(screen.getByText("Edge review in flight")).toBeInTheDocument();
    expect(screen.getByText("Payments edge")).toBeInTheDocument();
  });

  it("hides spawned drafts when the linked review is already on the rail", () => {
    mockDraftEntries = [
      {
        architectureId: "arch-spawned",
        displayName: "Vertex 2",
        customerStatus: "ready-for-review",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-10T12:00:00Z",
        linkedReviewId: "run-mid",
        serverUpdatedUtc: "2026-08-10T12:00:00Z",
      },
    ];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Vertex 2 review",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews>
        <UnfinishedWorkRail runs={runs} />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("unfinished-work-rail")).toBeInTheDocument();
    expect(screen.getByText("Vertex 2 review")).toBeInTheDocument();
    expect(screen.queryByText("Vertex 2")).toBeNull();
  });

  it("hides when empty", () => {
    mockDraftEntries = [];
    const { container } = render(<UnfinishedWorkRail runs={[] as RunSummary[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders column headers for a single unfinished item", () => {
    mockDraftEntries = [];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(<UnfinishedWorkRail runs={runs} />);

    expect(screen.getByTestId("unfinished-work-rail-column-headers")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_NAME)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS)).toBeInTheDocument();
    expect(screen.getByTestId("unfinished-work-rail-table")).toBeInTheDocument();
  });

  it("renders desktop column headers when multiple unfinished items are listed", () => {
    mockDraftEntries = [
      {
        architectureId: "arch-1",
        displayName: "Payments edge",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-10T12:00:00Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-08-10T12:00:00Z",
      },
    ];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews>
        <UnfinishedWorkRail runs={runs} />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("unfinished-work-rail-column-headers")).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_NAME)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_TYPE)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_UPDATED)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_HOME_YOUR_WORK_COLUMN_STATUS)).toBeInTheDocument();
  });

  it("uses an enterprise table so columns stay grouped across rows", () => {
    mockDraftEntries = [
      {
        architectureId: "arch-long",
        displayName: "Architecture Review Packet: B2B SaaS Tenant Migration Platform",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-10T12:00:00Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-08-10T12:00:00Z",
      },
      {
        architectureId: "arch-short",
        displayName: "Vertex",
        customerStatus: "draft",
        ownerLabel: "You",
        lastUpdatedUtc: "2026-08-09T12:00:00Z",
        linkedReviewId: null,
        serverUpdatedUtc: "2026-08-09T12:00:00Z",
      },
    ];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews>
        <UnfinishedWorkRail runs={runs} />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    const table = screen.getByTestId("unfinished-work-rail-table");
    const colgroup = table.querySelector("colgroup");

    expect(table).toBeInTheDocument();
    expect(colgroup?.children).toHaveLength(5);
    expect(screen.getAllByTestId(/unfinished-work-rail-item-/)).toHaveLength(3);
  });

  it("renders a primary Continue review button for in-progress reviews", () => {
    mockDraftEntries = [];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(<UnfinishedWorkRail runs={runs} />);

    expect(screen.getByRole("link", { name: "Continue review" })).toBeInTheDocument();
  });

  it("surfaces mid-execute reviews from runs props", () => {
    mockDraftEntries = [];
    const runs = [
      {
        runId: "run-mid",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Edge review in flight",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(<UnfinishedWorkRail runs={runs} />);

    expect(screen.getByTestId("unfinished-work-rail")).toBeInTheDocument();
    expect(screen.getByText("Edge review in flight")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("prefers the refreshed reviews snapshot over the server-rendered runs prop", () => {
    mockDraftEntries = [];
    const serverRuns = [
      {
        runId: "run-stale",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Stale first paint review",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];
    const refreshedRuns = [
      {
        runId: "run-fresh",
        projectId: "default",
        createdUtc: "2026-08-10T13:00:00Z",
        description: "Refreshed review awaiting disposition",
        hasFindingsSnapshot: true,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews>
        <UnfinishedWorkRail runs={serverRuns} />
        <RunsReporter runs={refreshedRuns} />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByText("Stale first paint review")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Report refreshed reviews" }));

    expect(screen.queryByText("Stale first paint review")).toBeNull();
    expect(screen.getByText("Refreshed review awaiting disposition")).toBeInTheDocument();
    expect(screen.getByText("Ready for review")).toBeInTheDocument();
  });

  it("hides once the refreshed snapshot reports no unfinished reviews", () => {
    mockDraftEntries = [];
    const serverRuns = [
      {
        runId: "run-stale",
        projectId: "default",
        createdUtc: "2026-08-10T11:00:00Z",
        description: "Stale first paint review",
        hasFindingsSnapshot: false,
        hasGoldenManifest: false,
      },
    ] as RunSummary[];

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews>
        <UnfinishedWorkRail runs={serverRuns} />
        <RunsReporter runs={[]} />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("unfinished-work-rail")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Report refreshed reviews" }));

    expect(screen.queryByTestId("unfinished-work-rail")).toBeNull();
  });
});