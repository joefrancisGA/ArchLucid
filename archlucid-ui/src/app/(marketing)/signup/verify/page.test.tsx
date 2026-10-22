import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignupVerifyPage from "@/app/(marketing)/signup/verify/page";
import {
  SIGNUP_VERIFY_PRIMARY_CONTENT_ID,
  SIGNUP_VERIFY_SKIP_LINK_LABEL,
} from "@/lib/marketing/signup-verify-page-copy";

vi.mock("@/app/(marketing)/signup/verify/SignupVerifyClient", () => ({
  SignupVerifyClient: () => <div data-testid="signup-verify-client" />,
}));

describe("SignupVerifyPage buyer-polished shell (SVX)", () => {
  it("renders skip link, breadcrumb, claim orientation, and verification body", () => {
    render(<SignupVerifyPage />);

    expect(screen.getByTestId("signup-verify-page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SIGNUP_VERIFY_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SIGNUP_VERIFY_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("signup-verify-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("signup-verify-orientation-top")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Evaluation access only" })).toBeInTheDocument();
    expect(screen.getByTestId("signup-verify-primary-content")).toBeInTheDocument();
    expect(screen.getByTestId("signup-verify-client")).toBeInTheDocument();
    expect(screen.getByTestId("signup-verify-sources")).toBeInTheDocument();
  });
});
