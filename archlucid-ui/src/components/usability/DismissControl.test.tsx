import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DISMISS_CONTROL_LABEL, DismissControl } from "@/components/usability/DismissControl";

describe("DismissControl", () => {
  it("renders a text dismiss button with button semantics", () => {
    const onDismiss = vi.fn();
    render(<DismissControl onDismiss={onDismiss} data-testid="dismiss-control" />);

    const control = screen.getByTestId("dismiss-control");
    expect(control.tagName).toBe("BUTTON");
    expect(control).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: DISMISS_CONTROL_LABEL })).toBe(control);
    expect(screen.queryByRole("link", { name: DISMISS_CONTROL_LABEL })).toBeNull();

    fireEvent.click(control);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders an icon-only dismiss button with an accessible name", () => {
    const onDismiss = vi.fn();
    render(
      <DismissControl
        iconOnly
        ariaLabel="Dismiss guidance"
        onDismiss={onDismiss}
        data-testid="dismiss-control-icon"
      />,
    );

    const control = screen.getByTestId("dismiss-control-icon");
    expect(control.tagName).toBe("BUTTON");
    expect(screen.getByRole("button", { name: "Dismiss guidance" })).toBe(control);
    expect(screen.queryByRole("link", { name: "Dismiss guidance" })).toBeNull();

    fireEvent.click(control);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("supports custom text labels for session-scoped dismissal", () => {
    render(<DismissControl label="Dismiss for this session" onDismiss={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Dismiss for this session" })).toBeInTheDocument();
  });
});
