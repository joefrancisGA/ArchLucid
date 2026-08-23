import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  WizardSessionSaveReassurance,
  WizardSessionSaveStatus,
} from "@/components/wizard/WizardSessionSaveStatus";
import { WIZARD_SESSION_AUTOSAVE_REASSURANCE } from "@/lib/create-vs-review-intake-copy";

describe("WizardSessionSaveStatus", () => {
  it("renders nothing while the session is idle", () => {
    const { container } = render(<WizardSessionSaveStatus saveState="idle" lastSavedUtc={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("uses an h-9 inline row when aligned beside intake action buttons", () => {
    render(
      <WizardSessionSaveStatus
        layout="inline"
        saveState="saved"
        lastSavedUtc={new Date().toISOString()}
      />,
    );

    expect(screen.getByTestId("wizard-session-save-status")).toHaveClass("h-9", "items-center");
    expect(screen.queryByTestId("wizard-session-autosave-reassurance")).not.toBeInTheDocument();
  });

  it("keeps stacked reassurance inside the default layout", () => {
    render(
      <WizardSessionSaveStatus
        saveState="saved"
        lastSavedUtc={new Date().toISOString()}
      />,
    );

    expect(screen.getByTestId("wizard-session-autosave-reassurance")).toHaveTextContent(
      WIZARD_SESSION_AUTOSAVE_REASSURANCE,
    );
  });
});

describe("WizardSessionSaveReassurance", () => {
  it("renders reassurance only while saved or saving", () => {
    const { rerender } = render(<WizardSessionSaveReassurance saveState="saved" />);

    expect(screen.getByTestId("wizard-session-autosave-reassurance")).toBeInTheDocument();

    rerender(<WizardSessionSaveReassurance saveState="unsaved" />);

    expect(screen.queryByTestId("wizard-session-autosave-reassurance")).not.toBeInTheDocument();
  });
});
