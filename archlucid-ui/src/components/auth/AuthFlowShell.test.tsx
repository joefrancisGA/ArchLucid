import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
import { AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE } from "@/lib/authentication-sign-in-help-copy";

describe("AuthFlowShell", () => {
  it("renders a branded full-page shell with panel and passwordless footer", () => {
    render(
      <AuthFlowShell>
        <p>Sign-in content</p>
      </AuthFlowShell>,
    );

    expect(screen.getByTestId("auth-flow-shell")).toBeInTheDocument();
    expect(screen.getByTestId("auth-flow-panel")).toBeInTheDocument();
    expect(screen.getByText("Sign-in content")).toBeInTheDocument();
    expect(screen.getByLabelText("ArchLucid — welcome")).toBeInTheDocument();
    expect(screen.queryByText(/Architecture review workspace/i)).not.toBeInTheDocument();
    expect(screen.getByText(/does not use a product password/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start an evaluation/i })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(screen.getByRole("link", { name: AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE })).toHaveAttribute(
      "href",
      "/help/authentication-sign-in",
    );
  });

  it("hides evaluation signup when requested", () => {
    render(
      <AuthFlowShell showEvaluationSignupLink={false}>
        <p>Invite flow</p>
      </AuthFlowShell>,
    );

    expect(screen.queryByRole("link", { name: /Start an evaluation/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE })).toBeInTheDocument();
  });

  it("shows return destination hint when the user arrived from a deep link", () => {
    render(
      <AuthFlowShell hasReturnDestination>
        <p>Sign-in content</p>
      </AuthFlowShell>,
    );

    expect(screen.getByTestId("auth-flow-return-destination-hint")).toBeInTheDocument();
  });
});
