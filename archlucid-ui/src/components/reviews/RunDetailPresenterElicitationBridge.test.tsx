import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UseReviewPresenterElicitationResult } from "@/hooks/use-review-presenter-elicitation";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: true,
  mode: "working" as const,
}));

const searchParamsMock = vi.hoisted(() => ({
  value: new URLSearchParams("reviewTab=overview&presenter=1"),
}));

const elicitationMock = vi.hoisted(() => ({
  value: {
    primaryQuestion: {
      questionKey: "latency",
      tier: "MUST",
      prompt: "Is a three-second response time acceptable?",
    },
    pendingQuestionCount: 1,
    title: "Is a three-second response time acceptable?",
    readyToFinalize: false,
    busy: false,
    confirm: vi.fn(async () => undefined),
    reject: vi.fn(async () => undefined),
    askAnother: vi.fn(async () => undefined),
    transparencyTrail: null,
    lastRecordedEntry: null,
  } satisfies UseReviewPresenterElicitationResult,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock.value,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/reviews/run-a",
}));

vi.mock("@/hooks/use-review-presenter-elicitation", () => ({
  useReviewPresenterElicitation: () => elicitationMock.value,
}));

vi.mock("@/hooks/use-review-workbench-shortcuts", () => ({
  useReviewWorkbenchShortcuts: vi.fn(),
}));

import { RunDetailPresenterElicitationBridge } from "@/components/reviews/RunDetailPresenterElicitationBridge";

const RUN_ID = "run-a";

const panels = {
  overview: <div data-testid="panel-overview">Overview</div>,
  findings: <div data-testid="panel-findings">Findings</div>,
  evidence: <div>Evidence</div>,
  policies: <div>Policies</div>,
  decisionsRemediation: <div>Decisions</div>,
  reviewPackage: <div>Package</div>,
  architecture: <div>Architecture</div>,
  activity: <div>Activity</div>,
};

describe("RunDetailPresenterElicitationBridge (FD-01)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = true;
    workspaceModeMock.mode = "working";
    searchParamsMock.value = new URLSearchParams("reviewTab=overview&presenter=1");
    elicitationMock.value = {
      primaryQuestion: {
        questionKey: "latency",
        tier: "MUST",
        prompt: "Is a three-second response time acceptable?",
      },
      pendingQuestionCount: 1,
      title: "Is a three-second response time acceptable?",
      readyToFinalize: false,
      busy: false,
      confirm: vi.fn(async () => undefined),
      reject: vi.fn(async () => undefined),
      askAnother: vi.fn(async () => undefined),
      transparencyTrail: null,
      lastRecordedEntry: null,
    };
  });

  it("shows confirm, reject, and ask-another actions in Working presenter mode", () => {
    render(
      <RunDetailPresenterElicitationBridge
        runId={RUN_ID}
        architectureRequestId="draft-1"
        defensibilityStrip={<div data-testid="review-defensibility-strip">Trail</div>}
        panels={panels}
      />,
    );

    expect(screen.getByTestId("review-presenter-surface")).toBeInTheDocument();
    expect(screen.getByTestId("review-presenter-elicitation-confirm")).toHaveTextContent("Yes");
    expect(screen.getByTestId("review-presenter-elicitation-reject")).toHaveTextContent("No");
    expect(screen.getByTestId("review-presenter-elicitation-another")).toHaveTextContent("Another question");
    expect(screen.getByTestId("review-defensibility-strip")).toBeInTheDocument();
    expect(screen.queryByTestId("review-detail-workspace-tabs")).toBeNull();
  });

  it("shows an honest ready-to-finalize state without action buttons when no question remains", () => {
    elicitationMock.value = {
      ...elicitationMock.value,
      readyToFinalize: true,
      primaryQuestion: null,
      pendingQuestionCount: 0,
      title: "Ready to finalize",
    };

    render(
      <RunDetailPresenterElicitationBridge
        runId={RUN_ID}
        architectureRequestId="draft-1"
        panels={panels}
      />,
    );

    expect(screen.getByTestId("review-presenter-elicitation-body")).toHaveTextContent(/finalize when the package is ready/i);
    expect(screen.queryByTestId("review-presenter-elicitation-confirm")).toBeNull();
    expect(screen.queryByTestId("review-presenter-elicitation-reject")).toBeNull();
    expect(screen.queryByTestId("review-presenter-elicitation-another")).toBeNull();
  });

  it("shows recorded-as-asserted confirmation after presenter capture", () => {
    elicitationMock.value = {
      ...elicitationMock.value,
      lastRecordedEntry: {
        questionKey: "latency",
        answer: "Yes",
        responderLabel: "Room",
      },
      transparencyTrail: {
        asserted: [{ key: "answer.latency", value: "Yes", responderLabel: "Room" }],
        inferred: [],
        skipped: [],
      },
    };

    render(
      <RunDetailPresenterElicitationBridge
        runId={RUN_ID}
        architectureRequestId="draft-1"
        panels={panels}
      />,
    );

    expect(screen.getByTestId("review-presenter-recorded-asserted")).toHaveTextContent("Recorded as asserted");
    expect(screen.getByTestId("review-presenter-asserted-trail")).toHaveTextContent("Yes");
  });

  it("does not enter presenter elicitation in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;
    workspaceModeMock.mode = "guided";

    render(
      <RunDetailPresenterElicitationBridge
        runId={RUN_ID}
        architectureRequestId="draft-1"
        panels={panels}
      />,
    );

    expect(screen.queryByTestId("review-presenter-surface")).toBeNull();
    expect(screen.queryByTestId("review-presenter-elicitation-confirm")).toBeNull();
    expect(screen.getByTestId("review-detail-workspace-tabs")).toBeInTheDocument();
  });

  it("starts room elicitation inline without presenter zoom when roomElicitation=1", () => {
    workspaceModeMock.isWorkingMode = true;
    searchParamsMock.value = new URLSearchParams("reviewTab=overview&roomElicitation=1");

    render(
      <RunDetailPresenterElicitationBridge
        runId={RUN_ID}
        architectureRequestId="draft-1"
        defensibilityStrip={<div data-testid="review-defensibility-strip">Trail</div>}
        panels={panels}
      />,
    );

    expect(screen.queryByTestId("review-presenter-surface")).toBeNull();
    expect(screen.getByTestId("review-detail-workspace-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("review-room-elicitation-panel")).toBeInTheDocument();
    expect(screen.getByTestId("review-presenter-elicitation-confirm")).toHaveTextContent("Yes");
    expect(screen.getByTestId("review-defensibility-strip")).toBeInTheDocument();
  });

  it("does not show elicitation chrome when neither presenter nor room flag is set", () => {
    workspaceModeMock.isWorkingMode = true;
    searchParamsMock.value = new URLSearchParams("reviewTab=overview");

    render(
      <RunDetailPresenterElicitationBridge
        runId={RUN_ID}
        architectureRequestId="draft-1"
        panels={panels}
      />,
    );

    expect(screen.queryByTestId("review-presenter-elicitation-confirm")).toBeNull();
    expect(screen.getByTestId("review-detail-workspace-tabs")).toBeInTheDocument();
  });
});
