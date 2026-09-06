import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";
import { ReviewInPipelineBanner } from "@/components/reviews/ReviewInPipelineBanner";
import { REVIEW_WORKBENCH_LAYOUT_TEST_ID } from "@/components/reviews/ReviewWorkbenchLayout";
import { useFindingCardShortcuts } from "@/hooks/useFindingCardShortcuts";
import { parseKeyCombo } from "@/hooks/useKeyboardShortcuts";
import { PROFESSIONAL_WORKBENCH_STORAGE_KEY } from "@/lib/workspace-mode/professional-workbench-preference";
import { WORKSPACE_MODE_STORAGE_KEY } from "@/lib/workspace-mode/workspace-mode-preference";
import type { RunSummary } from "@/types/authority";

const pushMock = vi.fn();
const replaceMock = vi.fn();

const workspaceModeMock = vi.hoisted(() => ({
  mode: "working" as const,
  mounted: true,
  accountSyncState: "synced" as const,
  isWorkingMode: true,
  setAndPersist: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams("reviewTab=findings"),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-review-workbench-shortcuts", () => ({
  useReviewWorkbenchShortcuts: vi.fn(),
}));

const inPipelineSummary: RunSummary = {
  runId: "run-abc",
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00.000Z",
  hasContextSnapshot: true,
  hasGraphSnapshot: true,
  hasFindingsSnapshot: false,
  hasGoldenManifest: false,
};

const FINDING_IDS = ["finding-alpha", "finding-bravo"] as const;

function fireCombo(combo: string, target: Window | Element = window): void {
  const parsed = parseKeyCombo(combo);

  fireEvent.keyDown(target, {
    key: parsed.key,
    altKey: parsed.alt,
    ctrlKey: parsed.ctrl,
    metaKey: parsed.meta,
    shiftKey: parsed.shift,
    bubbles: true,
  });
}

function FindingsTriageHarness(): ReactElement {
  useFindingCardShortcuts({ onAction: vi.fn() });

  return (
    <div data-testid="panel-findings">
      {FINDING_IDS.map((findingId) => (
        <article
          key={findingId}
          data-finding-id={findingId}
          data-testid={`finding-card-${findingId}`}
          role="article"
          tabIndex={0}
        />
      ))}
    </div>
  );
}

describe("review pipeline in-flight keyboard triage (PC-08)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    workspaceModeMock.mode = "working";
    workspaceModeMock.isWorkingMode = true;
    window.localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, "working");
    window.localStorage.setItem(PROFESSIONAL_WORKBENCH_STORAGE_KEY, "0");
  });

  it("keeps findings triage focusable and moves focus with Alt+J while the pipeline banner is visible", () => {
    render(
      <ReviewDetailWorkspace
        runId="run-abc"
        tabLifecycle={{
          manifestId: null,
          showProgressTracker: true,
          runCompleted: false,
        }}
        inPipelineBanner={<ReviewInPipelineBanner runId="run-abc" initialSummary={inPipelineSummary} />}
        panels={{
          overview: <div>Overview</div>,
          findings: <FindingsTriageHarness />,
          evidence: <div>Evidence</div>,
          policies: <div>Policies</div>,
          decisionsRemediation: <div>Decisions</div>,
          reviewPackage: <div>Package</div>,
          architecture: <div>Architecture</div>,
          activity: <div>Activity</div>,
        }}
      />,
    );

    expect(screen.queryByTestId(REVIEW_WORKBENCH_LAYOUT_TEST_ID)).not.toBeInTheDocument();
    expect(screen.getAllByTestId("review-in-pipeline-banner").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("review-in-pipeline-working-background-helper").length).toBeGreaterThan(0);

    const first = screen.getByTestId(`finding-card-${FINDING_IDS[0]}`);
    const second = screen.getByTestId(`finding-card-${FINDING_IDS[1]}`);

    first.focus();
    fireCombo("alt+j");

    expect(document.activeElement).toBe(second);
  });
});
