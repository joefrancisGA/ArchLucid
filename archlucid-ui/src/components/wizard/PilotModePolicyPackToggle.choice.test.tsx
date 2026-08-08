import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotModePolicyPackToggle } from "@/components/wizard/PilotModePolicyPackToggle";
import { FOCUSED_PILOT_MODE_COPY } from "@/lib/focused-pilot-mode-policy-packs";

describe("PilotModePolicyPackToggle — choice presentation", () => {
  it("states both scope outcomes instead of one inverted checkbox", () => {
    render(<PilotModePolicyPackToggle presentation="choice" enabled onEnabledChange={vi.fn()} />);

    expect(screen.getByText(FOCUSED_PILOT_MODE_COPY.choiceLegend)).toBeInTheDocument();
    expect(screen.getByText(FOCUSED_PILOT_MODE_COPY.choiceRecommendedDescription)).toBeInTheDocument();
    expect(screen.getByText(FOCUSED_PILOT_MODE_COPY.choiceAllDescription)).toBeInTheDocument();
    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-recommended")).toBeChecked();
  });

  it("reports the focused flag for whichever option is picked", () => {
    const onEnabledChange = vi.fn();

    render(<PilotModePolicyPackToggle presentation="choice" enabled onEnabledChange={onEnabledChange} />);

    fireEvent.click(screen.getByTestId("pilot-mode-policy-pack-toggle-all"));

    expect(onEnabledChange).toHaveBeenCalledWith(false);
  });

  it("marks the all-standards option selected when focused scope is off", () => {
    render(<PilotModePolicyPackToggle presentation="choice" enabled={false} onEnabledChange={vi.fn()} />);

    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-all")).toBeChecked();
    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-recommended")).not.toBeChecked();
  });

  it("does not restate the six standard names already shown in the applied callout", () => {
    render(<PilotModePolicyPackToggle presentation="choice" enabled onEnabledChange={vi.fn()} />);

    expect(screen.queryByText(/Security Architecture Baseline/i)).toBeNull();
    expect(screen.queryByText(/FinOps & Cloud Cost Optimization/i)).toBeNull();
  });
});
