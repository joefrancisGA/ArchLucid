import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";
import { REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { REVIEW_WORKBENCH_LAYOUT_TEST_ID } from "@/components/reviews/ReviewWorkbenchLayout";
import {
  REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT,
  PROFESSIONAL_WORKBENCH_STORAGE_KEY,
} from "@/lib/workspace-mode/professional-workbench-preference";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode/workspace-mode-preference";
import {
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
  reviewTabWatermarkKey,
} from "@/lib/usability/last-visited-watermark";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const workspaceModeMock = vi.hoisted(() => ({
  mode: "guided" as const,
  mounted: true,
  accountSyncState: "synced" as const,
  isWorkingMode: false,
  setAndPersist: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => searchParamsMock.value,
}));

const searchParamsMock = vi.hoisted(() => ({
  value: new URLSearchParams("reviewTab=overview"),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-review-workbench-shortcuts", () => ({
  useReviewWorkbenchShortcuts: vi.fn(),
}));

const pinnedReviewContextMock = vi.hoisted(() => ({
  isOpen: false,
  pinRunId: null as string | null,
  summary: null,
  findings: [] as const,
  findingsCount: null as number | null,
  stampStatusLine: null as string | null,
  loading: false,
  notFound: false,
  closePin: vi.fn(),
}));

vi.mock("@/hooks/use-pinned-review-context", () => ({
  usePinnedReviewContext: () => pinnedReviewContextMock,
}));

vi.mock("@/hooks/use-oidc-session-keepalive", () => ({
  useOidcSessionKeepalive: vi.fn(),
}));

const RUN_ID = "run-abc";

const workspacePanels = {
  overview: <div data-testid="panel-overview">Overview content</div>,
  findings: <div data-testid="panel-findings">Findings</div>,
  evidence: <div>Evidence</div>,
  policies: <div>Policies</div>,
  decisionsRemediation: <div>Decisions</div>,
  reviewPackage: <div>Package</div>,
  architecture: <div>Architecture</div>,
  activity: <div>Activity</div>,
};

const tabLifecycle = {
  manifestId: "manifest-1",
  showProgressTracker: false,
  runCompleted: false,
} as const;

function renderWorkingWorkbench(
  panels: typeof workspacePanels = workspacePanels,
): ReturnType<typeof render> {
  workspaceModeMock.mode = "working";
  workspaceModeMock.isWorkingMode = true;
  window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");

  return render(
    <ReviewDetailWorkspace
      runId={RUN_ID}
      tabLifecycle={tabLifecycle}
      panels={panels}
    />,
  );
}

describe("ReviewDetailWorkspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    workspaceModeMock.mode = "guided";
    workspaceModeMock.isWorkingMode = false;
    workspaceModeMock.mounted = true;
    searchParamsMock.value = new URLSearchParams("reviewTab=overview");
  });

  it("renders recovery lead once under the tab strip", () => {
    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        panels={workspacePanels}
        activePanelLead={<div data-testid="do-this-next-lead">Do this next</div>}
      />,
    );

    expect(screen.getAllByTestId("review-detail-active-panel-lead")).toHaveLength(1);
    expect(screen.getByTestId("do-this-next-lead")).toBeInTheDocument();
  });

  it("renders tab list and overview panel by default", () => {
    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabCounts={{ findings: 3, evidence: 2 }}
        panels={workspacePanels}
      />,
    );

    expect(screen.getByTestId("review-detail-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-workspace-tabs").className).toContain("overflow-y-hidden");
    expect(screen.getByRole("tab", { name: /Overview/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-overview")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Findings/i })).toHaveTextContent("3");
    expect(screen.getByRole("tab", { name: /Evidence/i })).toHaveTextContent("2");
  });

  it("switches tabs via replaceState without triggering Next.js router navigation", () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");

    window.history.replaceState({}, "", "/architecture/reviews/run-abc?reviewTab=overview");

    render(<ReviewDetailWorkspace runId={RUN_ID} tabCounts={{ findings: 3 }} panels={workspacePanels} />);

    fireEvent.click(screen.getByRole("tab", { name: /Findings/i }));

    expect(pushMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
    expect(replaceStateSpy).toHaveBeenCalled();
    expect(screen.getByRole("tab", { name: /Findings/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("panel-findings")).toBeInTheDocument();
  });

  it("shows new-since-last-visit marker when tab activity is newer than watermark", () => {
    markLastVisitedNow(reviewTabWatermarkKey(RUN_ID, "findings"), "2026-01-01T00:00:00.000Z");

    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabActivityAt={{ findings: "2026-02-01T12:00:00.000Z" }}
        panels={workspacePanels}
      />,
    );

    expect(screen.getByTestId("review-detail-tab-new-findings")).toBeInTheDocument();
  });

  it("clears tab marker after visiting the tab", () => {
    markLastVisitedNow(reviewTabWatermarkKey(RUN_ID, "findings"), "2026-01-01T00:00:00.000Z");

    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabActivityAt={{ findings: "2026-02-01T12:00:00.000Z" }}
        panels={workspacePanels}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: /Findings/i }));

    expect(screen.queryByTestId("review-detail-tab-new-findings")).not.toBeInTheDocument();
    expect(
      isActivityNewSinceLastVisit(
        reviewTabWatermarkKey(RUN_ID, "findings"),
        "2026-02-01T12:00:00.000Z",
      ),
    ).toBe(false);
  });

  it("with draft tabLifecycle keeps Findings on primary tabs for early risk review", () => {
    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabLifecycle={{
          manifestId: null,
          showProgressTracker: false,
          runCompleted: false,
        }}
        tabCounts={{ findings: 3 }}
        panels={workspacePanels}
      />,
    );

    expect(screen.getByRole("tab", { name: /Findings/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("review-detail-workspace-tab-findings"));

    expect(screen.getByTestId("panel-findings")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-workspace-panel-findings")).toBeInTheDocument();
  });

  it("renders workbench layout in Working mode when architecture, findings, and evidence tabs are visible", () => {
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "1");

    renderWorkingWorkbench();

    expect(screen.getByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("review-workbench-column-architecture")).toBeInTheDocument();
    expect(screen.getByTestId("review-workbench-column-findings")).toBeInTheDocument();
    expect(screen.getByTestId("review-workbench-column-evidence")).toBeInTheDocument();
  });

  it("shows workbench on first paint in Working mode without an explicit Tab-only preference", () => {
    renderWorkingWorkbench();

    expect(screen.getByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).toBeInTheDocument();
  });

  it("keeps tab-only layout in Guided mode", () => {
    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabLifecycle={tabLifecycle}
        panels={workspacePanels}
      />,
    );

    expect(screen.queryByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).not.toBeInTheDocument();
  });

  it("honors stored Tab-only preference in Working mode", () => {
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "0");

    renderWorkingWorkbench();

    expect(screen.queryByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).not.toBeInTheDocument();
  });

  it("highlights the related architecture node when a finding with relatedNodeIds is selected", async () => {
    const panels = {
      ...workspacePanels,
      findings: (
        <div data-testid="panel-findings">
          <article
            data-finding-id="finding-claims"
            data-finding-related-node-ids="claims_api"
            data-finding-title="Claims API latency"
          >
            <h3>Claims API latency</h3>
          </article>
        </div>
      ),
    };

    renderWorkingWorkbench(panels);

    window.dispatchEvent(
      new CustomEvent(REVIEW_WORKBENCH_DIAGRAM_NODES_EVENT, {
        detail: { nodes: [{ id: "claims_api", label: "Claims API" }] },
      }),
    );

    const workbenchFindings = screen.getByTestId("review-workbench-column-findings");
    const findingCard = workbenchFindings.querySelector('[data-finding-id="finding-claims"]');

    expect(findingCard).not.toBeNull();

    fireEvent.click(findingCard!);

    await waitFor(() => {
      expect(screen.getByTestId("review-workbench-column-architecture")).toHaveAttribute(
        "data-workbench-highlighted-node-id",
        "claims_api",
      );
    });
  });

  it("exiting Tab-only layout clears workbench selection when workbench unmounts", async () => {
    const panels = {
      ...workspacePanels,
      findings: (
        <div data-testid="panel-findings">
          <article
            data-finding-id="finding-claims"
            data-finding-related-node-ids="claims_api"
            data-finding-title="Claims API latency"
          >
            <h3>Claims API latency</h3>
          </article>
        </div>
      ),
    };

    renderWorkingWorkbench(panels);

    const workbenchFindings = screen.getByTestId("review-workbench-column-findings");
    const findingCard = workbenchFindings.querySelector('[data-finding-id="finding-claims"]');

    expect(findingCard).not.toBeNull();

    fireEvent.click(findingCard!);

    await waitFor(() => {
      expect(screen.getByTestId("review-workbench-column-findings")).toHaveAttribute(
        "data-workbench-selected-finding-id",
        "finding-claims",
      );
    });

    fireEvent.click(screen.getByTestId("review-workbench-exit"));

    await waitFor(() => {
      expect(screen.queryByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).not.toBeInTheDocument();
    });
  });

  it("shows presenter surface with findings, verdict strip, and trail in Working mode", () => {
    workspaceModeMock.mode = "working";
    workspaceModeMock.isWorkingMode = true;
    searchParamsMock.value = new URLSearchParams("reviewTab=findings&presenter=1");

    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        defensibilityStrip={<div data-testid="presenter-verdict-strip">Verdict</div>}
        panels={workspacePanels}
      />,
    );

    expect(screen.getByTestId("review-presenter-surface")).toBeInTheDocument();
    expect(screen.getByTestId("review-presenter-body")).toBeInTheDocument();
    expect(screen.getByTestId("presenter-verdict-strip")).toBeInTheDocument();
    expect(screen.getByTestId("panel-findings")).toBeInTheDocument();
    expect(screen.queryByTestId("review-detail-workspace-tabs")).toBeNull();
  });

  it("does not show Presenter control in Guided mode", () => {
    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        panels={workspacePanels}
      />,
    );

    expect(screen.queryByTestId("review-presenter-enter")).toBeNull();
  });

  it("restores finding selection from findingId query in tab-only layout (LI-13)", async () => {
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "0");
    searchParamsMock.value = new URLSearchParams("reviewTab=findings&findingId=finding-claims");

    const panels = {
      ...workspacePanels,
      findings: (
        <div data-testid="panel-findings">
          <article
            data-finding-id="finding-claims"
            data-finding-title="Claims API latency"
            tabIndex={0}
          >
            <h3>Claims API latency</h3>
          </article>
          <article data-finding-id="finding-other" data-finding-title="Other" tabIndex={0}>
            <h3>Other</h3>
          </article>
        </div>
      ),
    };

    renderWorkingWorkbench(panels);

    await waitFor(() => {
      const selected = screen.getByTestId("panel-findings").querySelector('[data-finding-id="finding-claims"]');
      expect(selected).toHaveAttribute("data-workbench-selected", "true");
    });
  });

  it("fails closed when findingId query does not match a rendered finding (LI-13)", async () => {
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "0");
    searchParamsMock.value = new URLSearchParams("reviewTab=findings&findingId=stale-missing");

    const panels = {
      ...workspacePanels,
      findings: (
        <div data-testid="panel-findings">
          <article data-finding-id="finding-claims" data-finding-title="Claims API latency" tabIndex={0}>
            <h3>Claims API latency</h3>
          </article>
        </div>
      ),
    };

    renderWorkingWorkbench(panels);

    await waitFor(() => {
      const card = screen.getByTestId("panel-findings").querySelector('[data-finding-id="finding-claims"]');
      expect(card).toHaveAttribute("data-workbench-selected", "false");
    });
  });

  it("keeps workbench visible while pipeline is in flight (LS-09)", () => {
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "1");
    workspaceModeMock.mode = "working";
    workspaceModeMock.isWorkingMode = true;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");

    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabLifecycle={{
          manifestId: null,
          showProgressTracker: true,
          runCompleted: false,
        }}
        inPipelineBanner={<div data-testid="in-pipeline-banner">Analysis running</div>}
        panels={workspacePanels}
      />,
    );

    expect(screen.getByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).toBeInTheDocument();
    expect(screen.getAllByTestId("in-pipeline-banner").length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: /Architecture/i })).toBeInTheDocument();
  });

  it("keeps the full primary tab strip visible when a pin is open (DR-11)", () => {
    pinnedReviewContextMock.isOpen = true;
    pinnedReviewContextMock.pinRunId = "run-pinned";
    pinnedReviewContextMock.findingsCount = 3;
    pinnedReviewContextMock.stampStatusLine = "Evaluation · Active";

    renderWorkingWorkbench();

    expect(screen.getByTestId("review-detail-pinned-context-layout")).toHaveAttribute("data-pin-open", "true");
    expect(screen.getByTestId("pinned-review-context-panel")).toBeInTheDocument();
    expect(screen.getByTestId(REVIEW_DETAIL_WORKSPACE_TABS_TEST_ID)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Findings/i })).toBeInTheDocument();
    expect(screen.queryByTestId("review-detail-workspace-tab-additional-label")).toBeNull();

    pinnedReviewContextMock.isOpen = false;
    pinnedReviewContextMock.pinRunId = null;
  });

  it("omits pin layout in Guided mode even when pinRunId is present (DR-11)", () => {
    pinnedReviewContextMock.isOpen = false;
    searchParamsMock.value = new URLSearchParams("reviewTab=overview&pinRunId=run-pinned");

    render(
      <ReviewDetailWorkspace runId={RUN_ID} tabLifecycle={tabLifecycle} panels={workspacePanels} />,
    );

    expect(screen.queryByTestId("pinned-review-context-panel")).toBeNull();
    expect(screen.getByTestId("review-detail-pinned-context-layout")).toHaveAttribute("data-pin-open", "false");
  });
});
