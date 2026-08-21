import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REFRESH_BUTTON_LABEL, RefreshButton } from "@/components/ui/refresh-button";

describe("RefreshButton", () => {
  it("renders the icon alongside the word so the accessible name stays 'Refresh'", () => {
    render(<RefreshButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: REFRESH_BUTTON_LABEL });

    expect(button).toBeInTheDocument();
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("keeps the label static while busy and spins the icon instead", () => {
    render(<RefreshButton busy onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: REFRESH_BUTTON_LABEL });

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(button.querySelector("svg")?.getAttribute("class")).toContain("animate-spin");
  });

  // The visible word must carry the accessible name (WCAG 2.5.3 Label in Name), and TB-2378 bars
  // `title` tooltips here because the button is disabled — and so unfocusable — while busy.
  it("names itself from the visible label with no aria-label or title override", () => {
    render(<RefreshButton onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: REFRESH_BUTTON_LABEL });

    expect(button).not.toHaveAttribute("aria-label");
    expect(button).not.toHaveAttribute("title");
  });

  it("supports a scoped label for surfaces that refresh a named subset", () => {
    render(<RefreshButton label="Refresh preview" onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Refresh preview" })).toBeInTheDocument();
  });

  it("fires onClick when idle and stays inert while busy", () => {
    const onClick = vi.fn();
    const { rerender } = render(<RefreshButton onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: REFRESH_BUTTON_LABEL }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<RefreshButton busy onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: REFRESH_BUTTON_LABEL }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("stays disabled when the caller disables it independently of busy", () => {
    render(<RefreshButton disabled onClick={vi.fn()} />);

    expect(screen.getByRole("button", { name: REFRESH_BUTTON_LABEL })).toBeDisabled();
  });
});
