import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewDetailWorkspace } from "@/components/reviews/ReviewDetailWorkspace";
import {
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
  reviewTabWatermarkKey,
} from "@/lib/usability/last-visited-watermark";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams("reviewTab=overview"),
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

describe("ReviewDetailWorkspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    expect(screen.getByTestId("review-detail-mark-all-seen")).toBeInTheDocument();
  });

  it("clears tab marker after mark all as seen", () => {
    markLastVisitedNow(reviewTabWatermarkKey(RUN_ID, "findings"), "2026-01-01T00:00:00.000Z");

    render(
      <ReviewDetailWorkspace
        runId={RUN_ID}
        tabActivityAt={{ findings: "2026-02-01T12:00:00.000Z" }}
        panels={workspacePanels}
      />,
    );

    fireEvent.click(screen.getByTestId("review-detail-mark-all-seen"));

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
});
