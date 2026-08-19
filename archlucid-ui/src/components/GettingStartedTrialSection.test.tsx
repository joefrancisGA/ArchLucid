import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GETTING_STARTED_TRIAL_POST_REGISTRATION_LEAD } from "@/lib/buyer/buyer-polish-copy";

import { GettingStartedTrialSection } from "./GettingStartedTrialSection";

const readLastRegistrationPayload = vi.fn();

vi.mock("@/lib/registration-session", () => ({
  readLastRegistrationPayload: () => readLastRegistrationPayload(),
}));

vi.mock("@/components/OnboardingStartClient", () => ({
  OnboardingStartClient: () => <div data-testid="onboarding-start-client-stub" />,
}));

describe("GettingStartedTrialSection", () => {
  beforeEach(() => {
    readLastRegistrationPayload.mockReturnValue(null);
  });

  it("renders nothing when not from registration and session has no payload", () => {
    const { container } = render(<GettingStartedTrialSection fromRegistrationQuery={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("omits duplicate Onboarding heading and points checklist to this page", () => {
    render(<GettingStartedTrialSection fromRegistrationQuery />);

    expect(screen.getByTestId("getting-started-trial-section")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Onboarding" })).not.toBeInTheDocument();
    expect(screen.getByText(GETTING_STARTED_TRIAL_POST_REGISTRATION_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("onboarding-start-client-stub")).toBeInTheDocument();
  });
});
