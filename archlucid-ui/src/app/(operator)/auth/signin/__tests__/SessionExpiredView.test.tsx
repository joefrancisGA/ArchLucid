import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { SessionExpiredView } from "@/app/(operator)/auth/signin/SessionExpiredView";

expect.extend(toHaveNoViolations);

describe("SessionExpiredView — copy per reason", () => {
  it("renders idle-timeout copy", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.getByTestId("session-expired-heading")).toHaveTextContent("Your session expired");
    expect(
      screen.getByText(/for your security, archlucid signed you out after a period of inactivity/i),
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

  it("promises resume only when a return destination is known", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} hasReturnDestination />);

    expect(screen.getByText(/sign in to continue where you left off/i)).toBeInTheDocument();
  });

  it("does not promise resume when no return destination is known", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} hasReturnDestination={false} />);

    expect(screen.queryByText(/where you left off/i)).toBeNull();
    expect(screen.getByText(/sign in again to continue/i)).toBeInTheDocument();
  });

  it("promises resume when unauthorized with a return destination", () => {
    render(<SessionExpiredView reason="unauthorized" onSignIn={vi.fn()} hasReturnDestination />);

    expect(screen.getByText(/sign in to continue where you left off/i)).toBeInTheDocument();
  });

  it("exposes session recovery title as the page heading", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Your session expired" })).toBeInTheDocument();
  });
});

describe("SessionExpiredView — sign-in action", () => {
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
});

describe("SessionExpiredView — return-to-home secondary action", () => {
  it("renders a public-safe secondary exit link by default (TB-1315)", () => {
    render(<SessionExpiredView reason="idle-timeout" onSignIn={vi.fn()} />);

    const link = screen.getByTestId("session-expired-return-home");

    expect(link).toHaveTextContent("Back to ArchLucid");
    expect(link).toHaveAttribute("href", "/welcome");
    expect(link).not.toHaveAttribute("href", "/");
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
