import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";
import { AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE } from "@/lib/authentication-sign-in-help-copy";
import { SESSION_IDLE_TIMEOUT_MINUTES } from "@/lib/auth/session-idle-timeout";
import { SESSION_EXPIRED_PASSWORDLESS_EXPLANATION } from "@/lib/auth/session-expired-page-copy";

expect.extend(toHaveNoViolations);

describe("SessionExpiredView — copy per reason", () => {
  it("renders idle-timeout copy with configured inactivity window", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(
      screen.getByText(
        new RegExp(
          `for your security, archlucid signed you out after ${SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity`,
          "i",
        ),
      ),
    ).toBeInTheDocument();
  });

  it("renders session-expired copy", () => {
    render(<SessionExpiredView reason="session-expired" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(screen.getByText(/your session is no longer active/i)).toBeInTheDocument();
  });

  it("renders signed-out copy", () => {
    render(<SessionExpiredView reason="signed-out" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("You're signed out");
  });

  it("renders unauthorized copy", () => {
    render(<SessionExpiredView reason="unauthorized" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Sign in required");
    expect(screen.getByText(/you need to sign in to access that page/i)).toBeInTheDocument();
  });

  it("falls back to safe generic copy for an unknown reason", () => {
    render(<SessionExpiredView reason="some-unexpected-internal-code" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(screen.getByText("Sign in again to continue.")).toBeInTheDocument();
    expect(screen.queryByText(/some-unexpected-internal-code/i)).toBeNull();
  });

  it("falls back to safe generic copy when reason is absent", () => {
    render(<SessionExpiredView onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
  });

  it("names the safe return destination beside the CTA", () => {
    render(
      <SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} returnUrl="/architecture/reviews/run-1" />,
    );

    expect(screen.getByTestId("session-expired-return-destination-hint")).toHaveTextContent(
      "Continue where you left off — sign in to return to Review detail.",
    );
  });

  it("uses Continue where you left off as the primary CTA when a return destination exists", () => {
    render(
      <SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} returnUrl="/architecture/reviews/run-1" />,
    );

    expect(screen.getByTestId("session-expired-sign-in")).toHaveTextContent("Continue where you left off");
  });

  it("does not name a return destination when returnUrl is absent", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.queryByTestId("session-expired-return-destination-hint")).toBeNull();
  });

  it("states server work preservation honestly for idle timeout", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.getByText(/saved drafts and other server-stored work remain available/i)).toBeInTheDocument();
    expect(screen.getByText(/unsaved changes in this browser tab were not preserved/i)).toBeInTheDocument();
  });

  it("shows sign-out timestamp in disclosure for idle timeout", () => {
    render(
      <SessionExpiredView
        reason="idle-timeout"
        onSignIn={vi.fn()}
        sessionClearedAt="2026-08-20T18:30:00.000Z"
      />,
    );

    expect(screen.getByTestId("session-expired-sign-out-disclosure")).toBeInTheDocument();
  });

  it("exposes session recovery title as the page heading", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your session expired" })).toBeInTheDocument();
  });
});

describe("SessionExpiredView — sign-in action", () => {
  it("renders passwordless explanation above the Sign in button at body scale", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    const explanation = screen.getByText(SESSION_EXPIRED_PASSWORDLESS_EXPLANATION);
    const button = screen.getByTestId("session-expired-sign-in");

    expect(explanation.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders the Sign in button using the primary variant", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    const button = screen.getByTestId("session-expired-sign-in");

    expect(button).toHaveTextContent("Sign in");
    expect(button.className).toContain("var(--al-primary-action-bg)");
    expect(button.className).not.toContain("bg-neutral-900");
  });

  it("invokes onSignIn when clicked", () => {
    const onSignIn = vi.fn();

    render(<SessionExpiredView reason="idle-timeout" onSignIn={onSignIn} />);
    fireEvent.click(screen.getByTestId("session-expired-sign-in"));

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("raises authentication help beside the CTA row", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-auth-help")).toHaveTextContent(
      AUTHENTICATION_SIGN_IN_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("session-expired-auth-help")).toHaveAttribute(
      "href",
      "/help/authentication-sign-in",
    );
  });
});

describe("SessionExpiredView — return-to-home secondary action", () => {
  it("renders an app-home secondary exit link by default (TB-1315)", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    const link = screen.getByTestId("session-expired-return-home");

    expect(link).toHaveTextContent("Back to ArchLucid");
    expect(link).toHaveAttribute("href", "/");
  });

  it("omits the secondary exit link when showReturnHome is false", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} showReturnHome={false} />);

    expect(screen.queryByTestId("session-expired-return-home")).toBeNull();
  });
});

describe("SessionExpiredView — accessibility", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(await axe(container)).toHaveNoViolations();
  });

  it("exposes the sign-in action as a keyboard-focusable button", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    const button = screen.getByTestId("session-expired-sign-in");

    expect(button.tagName).toBe("BUTTON");
    button.focus();
    expect(button).toHaveFocus();
  });
});
