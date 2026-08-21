import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useCorePilotCommitContextQuery = vi.fn();

vi.mock("@/hooks/use-core-pilot-commit-context-query", () => ({
  useCorePilotCommitContextQuery: () => useCorePilotCommitContextQuery(),
}));

import { useReviewsNewSpecimenPreviewPresentation } from "./use-reviews-new-specimen-preview-presentation";

describe("useReviewsNewSpecimenPreviewPresentation", () => {
  it("shows the prominent section before the first committed review", () => {
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: { hasCommittedManifest: false },
    });

    const { result } = renderHook(() => useReviewsNewSpecimenPreviewPresentation());

    expect(result.current).toEqual({
      showProminentSection: true,
      showHeaderLinks: false,
    });
  });

  it("moves specimen preview into header links after the first committed review", () => {
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: false,
      isError: false,
      data: { hasCommittedManifest: true },
    });

    const { result } = renderHook(() => useReviewsNewSpecimenPreviewPresentation());

    expect(result.current).toEqual({
      showProminentSection: false,
      showHeaderLinks: true,
    });
  });

  it("hides both surfaces while commit context is loading", () => {
    useCorePilotCommitContextQuery.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
    });

    const { result } = renderHook(() => useReviewsNewSpecimenPreviewPresentation());

    expect(result.current).toEqual({
      showProminentSection: false,
      showHeaderLinks: false,
    });
  });
});
