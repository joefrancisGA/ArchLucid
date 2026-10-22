import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureIdentityDeskOpenQuestions } from "@/components/architecture/ArchitectureIdentityDeskOpenQuestions";
import {
  ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_EMPTY,
  ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_NOT_STORED,
} from "@/lib/architecture/architecture-open-questions-copy";

vi.mock("@/hooks/use-architecture-draft-query", () => ({
  useArchitectureDraftQuery: vi.fn(),
}));

import { useArchitectureDraftQuery } from "@/hooks/use-architecture-draft-query";

const mockedUseArchitectureDraftQuery = vi.mocked(useArchitectureDraftQuery);

describe("ArchitectureIdentityDeskOpenQuestions (P-20)", () => {
  it("distinguishes missing open questions from a stored empty string", () => {
    mockedUseArchitectureDraftQuery.mockReturnValue({
      data: { document: { openQuestions: undefined } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useArchitectureDraftQuery>);

    const { unmount } = render(
      <ArchitectureIdentityDeskOpenQuestions
        architectureId="arch-1"
        currentDraftId="draft-1"
        latestReviewId={null}
        drafts={[{ draftId: "draft-1", status: "Drafting", updatedUtc: "2026-08-10T12:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-open-questions-body")).toHaveTextContent(
      ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_NOT_STORED,
    );

    unmount();

    mockedUseArchitectureDraftQuery.mockReturnValue({
      data: { document: { openQuestions: "" } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useArchitectureDraftQuery>);

    render(
      <ArchitectureIdentityDeskOpenQuestions
        architectureId="arch-1"
        currentDraftId="draft-1"
        latestReviewId={null}
        drafts={[{ draftId: "draft-1", status: "Drafting", updatedUtc: "2026-08-10T12:00:00Z" }]}
      />,
    );

    expect(screen.getByTestId("architecture-identity-open-questions-body")).toHaveTextContent(
      ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_EMPTY,
    );
  });
});
