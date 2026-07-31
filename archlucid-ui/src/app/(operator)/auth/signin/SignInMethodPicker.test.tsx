import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SignInMethodPicker } from "@/app/(operator)/auth/signin/SignInMethodPicker";
import { SIGN_IN_PAGE_COPY } from "@/lib/auth/sign-in-page-copy";

describe("SignInMethodPicker", () => {
  it("makes email code the primary action for Architect and non-SSO users", () => {
    const onEmailCode = vi.fn();
    const onWorkSchool = vi.fn();

    render(
      <SignInMethodPicker
        options={{ workSchool: true, emailCode: true, supplementalProviders: [] }}
        onEmailCode={onEmailCode}
        onWorkSchool={onWorkSchool}
      />,
    );

    expect(screen.getByText(SIGN_IN_PAGE_COPY.optionsTitle)).toBeInTheDocument();
    expect(screen.getByTestId("sign-in-non-sso-orientation")).toHaveTextContent(
      SIGN_IN_PAGE_COPY.optionsOrientation,
    );

    const emailButton = screen.getByTestId("sign-in-email-code");
    const workSchoolButton = screen.getByTestId("sign-in-work-school");

    expect(emailButton.compareDocumentPosition(workSchoolButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(emailButton.className).toContain("var(--al-primary-action-bg)");
    expect(screen.queryByRole("link", { name: /Need help signing in/i })).not.toBeInTheDocument();

    fireEvent.click(emailButton);
    expect(onEmailCode).toHaveBeenCalledTimes(1);
  });

  it("keeps work or school as primary when email code is unavailable", () => {
    render(
      <SignInMethodPicker
        options={{ workSchool: true, emailCode: false, supplementalProviders: [] }}
        onEmailCode={vi.fn()}
        onWorkSchool={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("sign-in-email-code")).not.toBeInTheDocument();
    expect(screen.getByTestId("sign-in-work-school")).toBeInTheDocument();
  });
});
