import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";

import { GovernanceModeFirstUseCoach } from "@/components/governance/GovernanceModeFirstUseCoach";
import { GOVERNANCE_MODE_TEACHING_DISMISS_KEY } from "@/lib/governance-mode-teaching";

describe("GovernanceModeFirstUseCoach (TB-2392)", () => {
  beforeEach(() => {
    window.localStorage.removeItem(GOVERNANCE_MODE_TEACHING_DISMISS_KEY);
  });

  it("shows the coach when governance mode is enabled and teaching is not dismissed", () => {
    render(<GovernanceModeFirstUseCoach enabled />);

    expect(screen.getByTestId("governance-mode-first-use-coach")).toBeInTheDocument();
    expect(screen.getByTestId("governance-mode-first-use-coach-step-routes")).toBeInTheDocument();
  });

  it("hides the coach when governance mode is disabled", () => {
    render(<GovernanceModeFirstUseCoach enabled={false} />);

    expect(screen.queryByTestId("governance-mode-first-use-coach")).not.toBeInTheDocument();
  });

  it("persists dismiss to localStorage", async () => {
    const user = userEvent.setup();

    render(<GovernanceModeFirstUseCoach enabled />);

    await user.click(screen.getByTestId("governance-mode-first-use-coach-dismiss"));

    expect(window.localStorage.getItem(GOVERNANCE_MODE_TEACHING_DISMISS_KEY)).toBe("1");
    expect(screen.queryByTestId("governance-mode-first-use-coach")).not.toBeInTheDocument();
  });
});
