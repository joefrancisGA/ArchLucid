import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReviewsHubUnfinishedWorkHref } from "@/hooks/use-reviews-hub-unfinished-work-href";
import { ARCHITECTURES_LIST_PATH, architectureNestedFindingsPath } from "@/lib/architecture/architecture-routes";
import {
  patchInFlightOperation,
  resetInFlightOperationsForTests,
  trackInFlightOperation,
} from "@/lib/operations/in-flight-operations-store";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("@/lib/desk-continuity-preference", () => ({
  readCachedLastOpenArchitectureId: () => null,
}));

describe("useReviewsHubUnfinishedWorkHref", () => {
  beforeEach(resetInFlightOperationsForTests);
  afterEach(resetInFlightOperationsForTests);

  it("follows an active review without repeatedly updating the same store snapshot", () => {
    const { result } = renderHook(useReviewsHubUnfinishedWorkHref);

    expect(result.current).toBe(ARCHITECTURES_LIST_PATH);

    act(() => {
      trackInFlightOperation({
        operationId: "review-operation",
        title: "Architecture review",
        href: "/architecture/reviews/review-1",
        state: "Running",
        runId: "review-1",
        architectureId: "architecture-1",
      });
    });

    expect(result.current).toBe(`${architectureNestedFindingsPath("architecture-1")}?runId=review-1`);

    act(() => {
      patchInFlightOperation("review-operation", { state: "Succeeded" });
    });

    expect(result.current).toBe(ARCHITECTURES_LIST_PATH);
  });
});
