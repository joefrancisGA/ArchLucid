import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewCompletionNotification } from "@/hooks/use-review-completion-notification";
import { showDesktopNotification } from "@/lib/browser-desktop-notification";

const navigation = vi.hoisted(() => ({ pathname: "/architecture" }));

vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: false }),
}));
vi.mock("@/lib/browser-desktop-notification", () => ({
  getDesktopNotificationPermission: () => "default",
  showDesktopNotification: vi.fn(() => true),
}));
vi.mock("@/lib/operations/in-flight-operations-store", () => ({
  getInFlightOperations: () => [],
}));
vi.mock("@/lib/review-pipeline-completion-notify-dedupe", () => ({
  wasReviewPipelineCompletionNotified: () => false,
  markReviewPipelineCompletionNotified: vi.fn(),
}));

describe("useReviewCompletionNotification", () => {
  beforeEach(() => {
    navigation.pathname = "/architecture";
  });

  it("does not announce a completed review again when the pathname changes", () => {
    const { rerender } = renderHook(() =>
      useReviewCompletionNotification({ runId: "already-complete", enabled: true, isComplete: true }),
    );

    navigation.pathname = "/governance";
    rerender();

    expect(showDesktopNotification).not.toHaveBeenCalled();
  });

  it("announces the completion transition for a newly tracked review", () => {
    const { rerender } = renderHook(useReviewCompletionNotification, {
      initialProps: { runId: "already-complete", enabled: true, isComplete: true },
    });

    rerender({ runId: "next-review", enabled: true, isComplete: false });
    rerender({ runId: "next-review", enabled: true, isComplete: true });
    navigation.pathname = "/governance";
    rerender({ runId: "next-review", enabled: true, isComplete: true });

    expect(showDesktopNotification).toHaveBeenCalledExactlyOnceWith(
      expect.any(String),
      expect.objectContaining({ tag: "review-complete:next-review" }),
    );
  });
});
