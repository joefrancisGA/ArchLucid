import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignupPage from "@/app/(marketing)/signup/page";
import { SIGNUP_CLAIM_DISCIPLINE_HEADING } from "@/lib/signup-evidence-copy";
import {
  SIGNUP_PRIMARY_CONTENT_ID,
  SIGNUP_SKIP_LINK_LABEL,
} from "@/lib/marketing/signup-page-copy";

vi.mock("@/lib/marketing/is-public-signup-enabled", () => ({
  isPublicSelfServiceSignupEnabled: (): boolean => false,
}));

vi.mock("@/app/(marketing)/see-it/SeeItDeliverablePreview", () => ({
  SeeItDeliverablePreview: () => <div data-testid="see-it-deliverable-preview" />,
}));

vi.mock("@/components/marketing/SignupAccessRequestPanel", () => ({
  SignupAccessRequestPanel: () => <div data-testid="signup-access-request-panel" />,
}));

vi.mock("@/components/marketing/SignupEvaluationAsideRail", () => ({
  SignupEvaluationAsideRail: () => <aside data-testid="signup-evaluation-aside-rail" />,
}));

describe("SignupPage buyer-polished shell (SIG)", () => {
  it("renders skip link, breadcrumb, claim orientation, and signup body", () => {
    render(<SignupPage />);

    expect(screen.getByTestId("signup-page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SIGNUP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SIGNUP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("signup-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("signup-orientation-top")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: SIGNUP_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("signup-primary-content")).toBeInTheDocument();
    expect(screen.getByTestId("signup-access-request-panel")).toBeInTheDocument();
    expect(screen.getByTestId("signup-evaluation-aside-rail")).toBeInTheDocument();
    expect(screen.getByTestId("signup-sources")).toBeInTheDocument();
  });
});
