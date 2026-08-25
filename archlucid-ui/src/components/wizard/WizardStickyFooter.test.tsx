import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardStickyFooter } from "@/components/wizard/WizardStickyFooter";
import type { WizardCreationProgressState } from "@/components/wizard/WizardCreationProgressNotices";
import { ApiRequestError } from "@/lib/api-request-error";
import { resolveReviewStartStages } from "@/lib/review-start-progress-stages";

function idleProgress(): WizardCreationProgressState {
  return {
    showStagedPanel: false,
    activeStageId: null,
    stages: resolveReviewStartStages(false),
    waitCopy: null,
    outcome: null,
    isActive: false,
    isRechecking: false,
  };
}

describe("WizardStickyFooter", () => {
  it("derives every test id from the wizard prefix", () => {
    render(
      <WizardStickyFooter testIdPrefix="quick-start" progress={idleProgress()} onRecheck={vi.fn()}>
        <button type="button">Next</button>
      </WizardStickyFooter>,
    );

    expect(screen.getByTestId("quick-start-footer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("renders staged create progress while the create call is in flight", () => {
    render(
      <WizardStickyFooter
        testIdPrefix="quick-start"
        progress={{
          ...idleProgress(),
          isActive: true,
          showStagedPanel: true,
          activeStageId: "creating-workspace",
          waitCopy: null,
        }}
        onRecheck={vi.fn()}
      >
        <button type="button">Next</button>
      </WizardStickyFooter>,
    );

    expect(screen.getByTestId("quick-start-review-start-progress")).toBeInTheDocument();

    const startButton = screen.getByRole("button", { name: "Next" });
    const progress = screen.getByTestId("quick-start-review-start-progress");
    expect(startButton.compareDocumentPosition(progress) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("offers a recheck instead of an error when the browser stopped waiting", () => {
    const onRecheck = vi.fn();

    render(
      <WizardStickyFooter
        testIdPrefix="simplified-pilot"
        progress={{ ...idleProgress(), outcome: { kind: "unresolved" } }}
        onRecheck={onRecheck}
      >
        <span />
      </WizardStickyFooter>,
    );

    expect(screen.getByTestId("simplified-pilot-unresolved-notice")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("review-start-unresolved-recheck"));
    expect(onRecheck).toHaveBeenCalledTimes(1);
  });

  it("shows step validation copy on any step", () => {
    render(
      <WizardStickyFooter
        testIdPrefix="quick-start"
        progress={idleProgress()}
        onRecheck={vi.fn()}
        stepValidationMessage="Fix the highlighted fields."
      >
        <span />
      </WizardStickyFooter>,
    );

    expect(screen.getByTestId("quick-start-validation-error")).toHaveTextContent(
      "Fix the highlighted fields.",
    );
  });

  it("shows Problem Details for a submit failure only on the review step", () => {
    const error = new ApiRequestError("Not permitted", {
      problem: { title: "Forbidden", detail: "Role cannot create runs", errorCode: "VALIDATION_FAILED" },
      correlationId: "corr-footer-1",
      httpStatus: 403,
    });

    const { rerender } = render(
      <WizardStickyFooter
        testIdPrefix="quick-start"
        progress={idleProgress()}
        onRecheck={vi.fn()}
        submitError={error}
        showSubmitError={false}
      >
        <span />
      </WizardStickyFooter>,
    );

    expect(screen.queryByTestId("quick-start-submit-error")).not.toBeInTheDocument();

    rerender(
      <WizardStickyFooter
        testIdPrefix="quick-start"
        progress={idleProgress()}
        onRecheck={vi.fn()}
        submitError={error}
        showSubmitError
      >
        <span />
      </WizardStickyFooter>,
    );

    expect(screen.getByTestId("quick-start-submit-error")).toBeInTheDocument();
    expect(screen.getByText(/corr-footer-1/)).toBeInTheDocument();
  });
});
