import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewPresenterHeaderButton } from "@/components/reviews/ReviewPresenterHeaderButton";

const pushMock = vi.fn();
const enterPresenterMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/components/reviews/use-review-detail-workspace-presenter", () => ({
  useReviewDetailWorkspacePresenter: () => ({
    enterPresenter: enterPresenterMock,
    exitPresenter: vi.fn(),
  }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

describe("ReviewPresenterHeaderButton (IR-012)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    enterPresenterMock.mockReset();
  });

  it("deep-links to inhabited findings room when parent architecture id is known", () => {
    render(
      <ReviewPresenterHeaderButton
        runId="run-42"
        reviewCompleted
        manifestVersion="manifest-v1"
        parentArchitectureId="architecture-identity-001"
      />,
    );

    fireEvent.click(screen.getByTestId("review-presenter-enter"));

    expect(pushMock).toHaveBeenCalledWith(
      "/architecture/architectures/architecture-identity-001/findings?runId=run-42&roomElicitation=1",
    );
    expect(enterPresenterMock).not.toHaveBeenCalled();
  });

  it("enters review-detail presenter mode when architecture id is unknown", () => {
    render(
      <ReviewPresenterHeaderButton runId="run-42" reviewCompleted manifestVersion="manifest-v1" />,
    );

    fireEvent.click(screen.getByTestId("review-presenter-enter"));

    expect(enterPresenterMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
