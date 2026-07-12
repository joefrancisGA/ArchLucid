import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  DECISION_REGISTER_VIEW_CARDS_LABEL,
  DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_LABEL,
} from "./decision-register-copy";
import { DecisionRegisterViewSwitcher } from "./DecisionRegisterViewSwitcher";

describe("DecisionRegisterViewSwitcher", () => {
  it("exposes segmented-control semantics with aria-pressed on the active view", () => {
    const onViewModeChange = vi.fn();

    render(
      <DecisionRegisterViewSwitcher viewMode="cards" onViewModeChange={onViewModeChange} />,
    );

    const group = screen.getByRole("group", { name: DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL });
    expect(group).toBeInTheDocument();
    expect(group).not.toHaveAttribute("role", "tablist");

    const cardsButton = screen.getByRole("button", { name: DECISION_REGISTER_VIEW_CARDS_LABEL });
    const timelineButton = screen.getByRole("button", { name: DECISION_REGISTER_VIEW_TIMELINE_LABEL });

    expect(cardsButton).toHaveAttribute("aria-pressed", "true");
    expect(cardsButton).not.toHaveAttribute("role", "tab");
    expect(timelineButton).toHaveAttribute("aria-pressed", "false");
    expect(timelineButton).not.toHaveAttribute("role", "tab");
  });

  it("calls onViewModeChange when timeline is selected", () => {
    const onViewModeChange = vi.fn();

    render(
      <DecisionRegisterViewSwitcher viewMode="cards" onViewModeChange={onViewModeChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: DECISION_REGISTER_VIEW_TIMELINE_LABEL }));

    expect(onViewModeChange).toHaveBeenCalledWith("timeline");
  });
});
