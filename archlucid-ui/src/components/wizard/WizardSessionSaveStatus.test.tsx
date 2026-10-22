import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";

describe("WizardSessionSaveStatus", () => {
  it("renders nothing while the session is idle", () => {
    const { container } = render(<WizardSessionSaveStatus saveState="idle" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the saved chip without a redundant timestamp label", () => {
    render(<WizardSessionSaveStatus layout="inline" saveState="saved" />);

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.queryByText(/Saved just now/i)).not.toBeInTheDocument();
  });

  it("uses an h-9 inline row when aligned beside intake action buttons", () => {
    render(
      <WizardSessionSaveStatus layout="inline" saveState="saved" />,
    );

    expect(screen.getByTestId("wizard-session-save-status")).toHaveClass("h-9", "items-center");
    expect(screen.queryByTestId("wizard-session-autosave-reassurance")).not.toBeInTheDocument();
  });

  it("does not render autosave reassurance in the default stacked layout", () => {
    render(
      <WizardSessionSaveStatus saveState="saved" />,
    );

    expect(screen.getByTestId("wizard-session-save-status")).toBeInTheDocument();
    expect(screen.queryByTestId("wizard-session-autosave-reassurance")).not.toBeInTheDocument();
  });
});
