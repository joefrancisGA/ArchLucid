import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotBaselineWizard } from "@/components/PilotBaselineWizard";

vi.mock("@/lib/demo-ui-env", () => ({
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

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
});
