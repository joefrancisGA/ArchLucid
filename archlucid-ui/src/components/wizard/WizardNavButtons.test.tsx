import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardNavButtons } from "./WizardNavButtons";

describe("WizardNavButtons", () => {
  it("hides Back on first step when isFirstStep is true", () => {
    const onBack = vi.fn();

    render(
      <WizardNavButtons
        onBack={onBack}
        onNext={vi.fn()}
        isFirstStep
        canProceed
      />,
    );

    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("shows Back when not first step", () => {
    const onBack = vi.fn();

    render(
      <WizardNavButtons
        onBack={onBack}
        onNext={vi.fn()}
        isFirstStep={false}
        canProceed
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("disables Next when canProceed is false", () => {
    render(
      <WizardNavButtons onNext={vi.fn()} canProceed={false} isLastInputStep={false} />,
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("shows Submit on last input step and disables while submitting", () => {
    const onSubmit = vi.fn();

    const { rerender } = render(
      <WizardNavButtons
        onSubmit={onSubmit}
        isLastInputStep
        canProceed
        submitting={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

    rerender(
      <WizardNavButtons
        onSubmit={onSubmit}
        isLastInputStep
        canProceed
        submitting
      />,
    );

    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
  });

  it("invokes onNext when Next is clicked", () => {
    const onNext = vi.fn();

    render(
      <WizardNavButtons onNext={onNext} canProceed isLastInputStep={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
