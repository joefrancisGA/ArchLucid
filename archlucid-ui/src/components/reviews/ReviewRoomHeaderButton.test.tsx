import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewRoomHeaderButton } from "@/components/reviews/ReviewRoomHeaderButton";

const pushMock = vi.fn();
const enterRoomMock = vi.fn();
const exitRoomMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/components/reviews/use-review-detail-workspace-room-elicitation", () => ({
  useReviewDetailWorkspaceRoomElicitation: () => ({
    roomElicitationActive: false,
    enterRoomElicitation: enterRoomMock,
    exitRoomElicitation: exitRoomMock,
  }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

describe("ReviewRoomHeaderButton (IP-007)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    enterRoomMock.mockReset();
    exitRoomMock.mockReset();
  });

  it("deep-links to inhabited findings room when parent architecture id is known", () => {
    render(
      <ReviewRoomHeaderButton
        runId="run-42"
        reviewCompleted
        manifestVersion="manifest-v1"
        parentArchitectureId="architecture-identity-001"
      />,
    );

    fireEvent.click(screen.getByTestId("review-room-enter"));

    expect(pushMock).toHaveBeenCalledWith(
      "/architecture/architectures/architecture-identity-001/findings?runId=run-42&roomElicitation=1",
    );
    expect(enterRoomMock).not.toHaveBeenCalled();
  });

  it("enters review-detail room elicitation when architecture id is unknown", () => {
    render(
      <ReviewRoomHeaderButton runId="run-42" reviewCompleted manifestVersion="manifest-v1" />,
    );

    fireEvent.click(screen.getByTestId("review-room-enter"));

    expect(enterRoomMock).toHaveBeenCalledTimes(1);
    expect(pushMock).not.toHaveBeenCalled();
  });
});
