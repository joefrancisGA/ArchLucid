import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewsNewWizardResumeStrip } from "@/components/usability/ReviewsNewWizardResumeStrip";
import {
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("ReviewsNewWizardResumeStrip", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    push.mockClear();
  });

  it("shows continue and start over when a resumable session exists", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(<ReviewsNewWizardResumeStrip />);

    expect(screen.getByTestId("reviews-new-wizard-resume-strip")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resume your draft review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start over" })).toBeInTheDocument();
  });

  it("navigates to the wizard path when Continue is clicked", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(<ReviewsNewWizardResumeStrip />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(push).toHaveBeenCalledWith("/architecture/reviews/new?path=quick-review");
  });

  it("hides after Start over clears the saved session", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(<ReviewsNewWizardResumeStrip />);

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));

    expect(screen.queryByTestId("reviews-new-wizard-resume-strip")).not.toBeInTheDocument();
  });
});
