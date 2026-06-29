import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/use-core-pilot-commit-presentation-context", () => ({
  useCorePilotCommitPresentationContext: () => ({
    hasCommittedManifest: false,
    latestCommittedRunId: null,
  }),
}));

vi.mock("./FirstPilotIntakeWizard", () => ({
  FirstPilotIntakeWizard: () => <div data-testid="first-pilot-intake-wizard-stub">First pilot wizard</div>,
}));

vi.mock("./SocraticIntakeWizard", () => ({
  SocraticIntakeWizard: () => <div data-testid="socratic-intake-wizard-stub">Socratic wizard</div>,
}));

vi.mock("./NewRunWizardClient", () => ({
  NewRunWizardClient: () => <div data-testid="new-run-wizard-stub">Detailed wizard</div>,
}));

import { ReviewsNewPathSwitcher } from "./ReviewsNewPathSwitcher";

describe("ReviewsNewPathSwitcher (first-run tenant)", () => {
  it("hides path tabs until the operator asks for more options", async () => {
    render(<ReviewsNewPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-intake-wizard-stub")).toBeTruthy();
    });

    expect(screen.queryByTestId("reviews-new-path-toggle")).toBeNull();
    expect(screen.getByTestId("reviews-new-more-intake-options")).toBeTruthy();
    expect(screen.queryByText(/intake/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/evaluation standards/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More options" }));

    expect(screen.getByTestId("reviews-new-path-toggle")).toBeTruthy();
  });
});
