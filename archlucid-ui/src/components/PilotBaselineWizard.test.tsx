import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotBaselineWizard } from "@/components/PilotBaselineWizard";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { showError } from "@/lib/toast";

describe("PilotBaselineWizard", () => {
  it("shows simplified copy and Skip for now on step one", () => {
    render(<PilotBaselineWizard open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Set review-cycle baseline" })).toBeInTheDocument();
    expect(screen.getByText(/Enter a rough estimate now, or skip and add it later\./)).toBeInTheDocument();
    expect(screen.getByLabelText("Current median hours per architecture review")).toBeInTheDocument();
    expect(screen.getByTestId("pilot-baseline-wizard-skip")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("closes when Skip for now is clicked", () => {
    const onOpenChange = vi.fn();

    render(<PilotBaselineWizard open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByTestId("pilot-baseline-wizard-skip"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not expose monorepo ROI model paths in visible or screen-reader copy (TB-1393)", () => {
    render(<PilotBaselineWizard open onOpenChange={vi.fn()} />);

    expect(screen.queryByText(/PILOT_ROI_MODEL\.md/i)).toBeNull();
    expect(screen.queryByText(/docs\/library/i)).toBeNull();
    expect(screen.getByRole("link", { name: "Review ROI methodology" })).toHaveAttribute(
      "href",
      "/help/executive-summary#pilot-roi-measurement",
    );
  });

  it("disables Next until review hours are valid and shows inline errors without validation toast (TB-2007)", () => {
    render(<PilotBaselineWizard open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.change(screen.getByTestId("pilot-baseline-wizard-review-hours"), {
      target: { value: "24" },
    });

    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Manual preparation baseline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save baseline" })).toBeDisabled();
    expect(showError).not.toHaveBeenCalled();
  });
});
