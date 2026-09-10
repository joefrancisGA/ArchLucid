import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthCallbackAccessPanel } from "@/app/(operator)/auth/callback/AuthCallbackAccessPanel";
import {
  AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION,
  AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR,
  AUTH_CALLBACK_ACCESS_HEADING,
  AUTH_CALLBACK_ACCESS_SUBMIT_ERROR,
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

  it("shows generic submit error when the API returns a non-duplicate failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "send_failed" }, { status: 502 })),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByText(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR)).toBeInTheDocument();
    });

    expect(screen.getByTestId("auth-callback-access-form")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows generic submit error when fetch rejects", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByText(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("sends whitespace-only optional fields as null", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.change(screen.getByLabelText("Cloud / platform focus (optional)"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Brief note (optional)"), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      cloudPlatformFocus: string | null;
      note: string | null;
    };

    expect(body.cloudPlatformFocus).toBeNull();
    expect(body.note).toBeNull();
    vi.unstubAllGlobals();
  });

  it("cancel hides the form and clears a prior submit error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "send_failed" }, { status: 502 })),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByText(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByTestId("auth-callback-access-form")).not.toBeInTheDocument();
    expect(screen.queryByText(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR)).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("toggles the request form closed when request access is clicked again", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Token exchange failed." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    expect(screen.getByTestId("auth-callback-access-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    expect(screen.queryByTestId("auth-callback-access-form")).not.toBeInTheDocument();
  });

  it("shows back-to-sign-in recovery only after a successful submit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    expect(screen.queryByRole("link", { name: AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION })).toBeNull();

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION })).toHaveAttribute(
        "href",
        "/auth/signin",
      );
    });

    vi.unstubAllGlobals();
  });
});
