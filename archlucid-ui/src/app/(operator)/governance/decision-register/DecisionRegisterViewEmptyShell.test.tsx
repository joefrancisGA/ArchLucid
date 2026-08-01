import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL,
} from "./decision-register-copy";
import { DecisionRegisterViewEmptyShell } from "./DecisionRegisterViewEmptyShell";

describe("DecisionRegisterViewEmptyShell", () => {
  it("renders cards panel chrome for cards view", () => {
    render(
      <DecisionRegisterViewEmptyShell viewMode="cards">
        <span>empty body</span>
      </DecisionRegisterViewEmptyShell>,
    );

    expect(screen.getByTestId("decision-register-cards")).toHaveAttribute(
      "aria-label",
      DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL,
    );
    expect(screen.queryByTestId("decision-register-timeline-panel")).not.toBeInTheDocument();
    expect(screen.getByText("empty body")).toBeInTheDocument();
  });

  it("renders timeline panel chrome for timeline view", () => {
    render(
      <DecisionRegisterViewEmptyShell viewMode="timeline">
        <span>empty body</span>
      </DecisionRegisterViewEmptyShell>,
    );

    expect(screen.getByTestId("decision-register-timeline-panel")).toHaveAttribute(
      "aria-label",
      DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL,
    );
    expect(screen.queryByTestId("decision-register-cards")).not.toBeInTheDocument();
    expect(screen.getByText("empty body")).toBeInTheDocument();
  });
});
