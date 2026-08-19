import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthCallbackAccessPanel } from "@/app/(operator)/auth/callback/AuthCallbackAccessPanel";
import {
  AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR,
  AUTH_CALLBACK_ACCESS_HEADING,
  AUTH_CALLBACK_ACCESS_SUCCESS_TITLE,
} from "@/lib/auth/access-request-copy";

describe("AuthCallbackAccessPanel", () => {
  it("renders private-beta guidance and reveals the request form", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Token exchange failed." />);

    expect(screen.getByRole("heading", { name: AUTH_CALLBACK_ACCESS_HEADING })).toBeInTheDocument();
    expect(screen.getByText("Token exchange failed.")).toBeInTheDocument();
    expect(screen.queryByTestId("auth-callback-access-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByTestId("auth-callback-access-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/auth/signin");
  });

  it("keeps a single sign-in recovery action on the failure panel", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Token exchange failed." />);

    expect(screen.getAllByRole("link", { name: "Try again" })).toHaveLength(1);
    expect(screen.queryByRole("link", { name: "Back to sign in" })).toBeNull();
  });

  it("shows success state after submit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-success")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: AUTH_CALLBACK_ACCESS_SUCCESS_TITLE })).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows duplicate-email error messaging", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "duplicate_recent" }, { status: 409 })),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByText(AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
