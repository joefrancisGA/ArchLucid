import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS } from "@/lib/operator-first-hour-journey-nav";
import { OPERATOR_LINK } from "@/lib/design-tokens";

import { OperatorFirstHourJourneyStrip } from "./OperatorFirstHourJourneyStrip";

const mockUsePathname = vi.fn(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("OperatorFirstHourJourneyStrip", () => {
  it("renders the first-hour path heading and four step labels", () => {
    mockUsePathname.mockReturnValue("/");

    render(<OperatorFirstHourJourneyStrip />);

    expect(screen.getByTestId("operator-first-hour-journey-strip")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "First-hour path" })).toBeInTheDocument();

    for (const step of OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS) {
      expect(screen.getByRole("link", { name: `Step ${step.step}: ${step.label}` })).toBeInTheDocument();
    }
  });

  it("renders each step as a link with pill affordance and preserved href", () => {
    mockUsePathname.mockReturnValue("/");

    render(<OperatorFirstHourJourneyStrip />);

    for (const step of OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS) {
      const link = screen.getByTestId(`operator-first-hour-step-${step.step}`);

      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", step.href);
      expect(link.className).toContain("border");
      expect(link.className).not.toBe(OPERATOR_LINK.step);
    }
  });

  it("does not expose Lane runbook copy and keeps the canonical guide as a text link", () => {
    mockUsePathname.mockReturnValue("/");

    render(<OperatorFirstHourJourneyStrip />);

    expect(screen.queryByText(/lane runbook/i)).not.toBeInTheDocument();

    const guideLink = screen.getByRole("link", { name: "Read the canonical guide" });

    expect(guideLink).toHaveAttribute("href", "/help/first-hour-operator-path");
    expect(guideLink.className).toContain("underline");
  });

  it("highlights the recommended first step on the overview route", () => {
    mockUsePathname.mockReturnValue("/");

    render(<OperatorFirstHourJourneyStrip />);

    const firstStep = screen.getByTestId("operator-first-hour-step-1");

    expect(firstStep.className).toContain(OPERATOR_LINK.stepPillRecommended.split(" ")[0]);
    expect(firstStep).not.toHaveAttribute("aria-current");
  });

  it("marks the active journey step on the matching route", () => {
    mockUsePathname.mockReturnValue("/reviews/new");

    render(<OperatorFirstHourJourneyStrip />);

    const firstStep = screen.getByTestId("operator-first-hour-step-1");

    expect(firstStep).toHaveAttribute("aria-current", "step");
    expect(firstStep.className).toContain("ring-1");
  });
});
