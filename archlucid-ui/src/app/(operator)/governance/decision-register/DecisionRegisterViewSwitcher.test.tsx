import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_VIEW_CARDS_LABEL,
  DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_LABEL,
} from "./decision-register-copy";
import { DecisionRegisterViewSwitcher } from "./DecisionRegisterViewSwitcher";

describe("DecisionRegisterViewSwitcher", () => {
  it("exposes URL-bound view chips with aria-current on the active view", () => {
    render(<DecisionRegisterViewSwitcher viewMode="cards" currentSearch="runId=abc" />);

    const group = screen.getByRole("group", { name: DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL });
    expect(group).toBeInTheDocument();

    const cardsLink = screen.getByRole("link", { name: DECISION_REGISTER_VIEW_CARDS_LABEL });
    const timelineLink = screen.getByRole("link", { name: DECISION_REGISTER_VIEW_TIMELINE_LABEL });

    expect(cardsLink).toHaveAttribute("aria-current", "page");
    expect(timelineLink).not.toHaveAttribute("aria-current");
    expect(timelineLink).toHaveAttribute("href", "/governance/decision-register?runId=abc&view=timeline");
  });
});
