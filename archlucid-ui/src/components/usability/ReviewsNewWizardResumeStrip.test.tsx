import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReviewsNewWizardResumeStrip } from "@/components/usability/ReviewsNewWizardResumeStrip";
import {
  ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT,
} from "@/lib/reviews-new-wizard-session-resume";
import {
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

const push = vi.fn();
let pathQuery = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "path" ? pathQuery : null),
  }),
}));

describe("ReviewsNewWizardResumeStrip", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    push.mockClear();
    pathQuery = "";
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

  it("navigates to the wizard path when Continue is clicked from another path", () => {
    pathQuery = "guided-intake";
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(<ReviewsNewWizardResumeStrip />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(push).toHaveBeenCalledWith("/architecture/reviews/new?path=quick-review");
    expect(screen.queryByTestId("reviews-new-wizard-resume-strip")).not.toBeInTheDocument();
  });

  it("dismisses and requests in-page restore when Continue is clicked on the target path", () => {
    pathQuery = "quick-review";
    const listener = vi.fn();
    const scrollIntoView = vi.fn();

    window.addEventListener(ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT, listener);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    render(<ReviewsNewWizardResumeStrip />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(push).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("reviews-new-wizard-resume-strip")).not.toBeInTheDocument();

    window.removeEventListener(ARCHLUCID_REVIEWS_NEW_WIZARD_CONTINUE_EVENT, listener);
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
