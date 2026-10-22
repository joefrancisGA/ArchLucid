import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const createNavigate = vi.fn();
const reviewNavigate = vi.fn();

vi.mock("@/hooks/use-create-architecture-navigation", () => ({
  useCreateArchitectureNavigation: () => ({
    navigate: createNavigate,
    reset: vi.fn(),
    isNavigating: false,
    loadingLabel: "Starting architecture…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-review-intake-navigation", () => ({
  useReviewIntakeNavigation: () => ({
    navigate: reviewNavigate,
    reset: vi.fn(),
    isNavigating: false,
    isPending: false,
    activeStageId: null,
    showStagedPanel: false,
    stages: [],
    loadingLabel: "Starting review…",
    error: null,
  }),
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

import { OperatorHomeDualPathCards } from "@/components/operator-home/OperatorHomeDualPathCards";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

describe("OperatorHomeDualPathCards create architecture workflow", () => {
  it("uses the dedicated create-architecture navigation without review staged progress", () => {
    render(<OperatorHomeDualPathCards />);

    fireEvent.click(screen.getByTestId("operator-home-create-architecture-cta"));

    expect(createNavigate).toHaveBeenCalledTimes(1);
    expect(reviewNavigate).not.toHaveBeenCalled();
    expect(screen.queryByTestId("operator-home-review-start-progress")).toBeNull();
    expect(screen.getByRole("button", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
  });
});
