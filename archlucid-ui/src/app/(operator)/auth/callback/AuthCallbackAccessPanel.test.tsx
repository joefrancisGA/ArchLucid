import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fatalReportProblemCapture = vi.hoisted(() => ({
  lastProps: null as { errorTitle: string } | null,
}));

vi.mock("@/components/support/FatalPageReportProblemAction", () => ({
  FatalPageReportProblemSupportRow: (props: { errorTitle: string }) => {
    fatalReportProblemCapture.lastProps = props;
    return <div data-testid="fatal-page-report-problem-row" />;
  },
}));

import { AuthCallbackAccessPanel } from "@/app/(operator)/auth/callback/AuthCallbackAccessPanel";
import {
  AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION,
  AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR,
  AUTH_CALLBACK_ACCESS_HEADING,
  AUTH_CALLBACK_ACCESS_REQUEST_ACTION,
  AUTH_CALLBACK_ACCESS_SUBMIT_ERROR,
  AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL,
  AUTH_CALLBACK_ACCESS_SUCCESS_BODY,
  AUTH_CALLBACK_ACCESS_SUCCESS_TITLE,
  AUTH_CALLBACK_ACCESS_TRY_AGAIN_ACTION,
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

  it("shows generic submit error when the API returns rate limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "rate_limited" }, { status: 429 })),
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

    expect(screen.queryByText(AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR)).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows generic submit error when the API returns validation_failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "validation_failed", message: "Work email required." }, { status: 400 }),
      ),
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

    expect(screen.queryByText("Work email required.")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("does not parse JSON message field on non-409 API failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "send_failed", message: "Upstream mail relay rejected the request." }, { status: 502 }),
      ),
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

    expect(screen.queryByText("Upstream mail relay rejected the request.")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("normalizes padded work email via the email input before POST", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "  jordan@fabrikam.com  " } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });

    expect(screen.getByLabelText("Work email")).toHaveValue("jordan@fabrikam.com");

    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { workEmail: string };

    expect(body.workEmail).toBe("jordan@fabrikam.com");
    vi.unstubAllGlobals();
  });

  it("keeps required inputs editable while submit is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL })).toBeDisabled();
    });

    expect(screen.getByLabelText("Name")).not.toHaveAttribute("disabled");
    expect(screen.getByLabelText("Work email")).not.toHaveAttribute("disabled");

    resolveFetch?.(new Response(null, { status: 204 }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-success")).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("omits callback technical detail on the success view", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Token exchange failed." />);

    expect(screen.getByTestId("auth-callback-technical-detail")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-success")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("auth-callback-technical-detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Token exchange failed.")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("posts honeypot websiteUrl without client-side trim", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.change(screen.getByLabelText("Website"), { target: { value: "  https://spam.example  " } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { websiteUrl: string };

    expect(body.websiteUrl).toBe("  https://spam.example  ");
    vi.unstubAllGlobals();
  });

  it("shows success when honeypot website field is filled and API returns 204", async () => {
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
    fireEvent.change(screen.getByLabelText("Website"), { target: { value: "https://spam.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-success")).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("retains form values when the request form is toggled closed and reopened", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Token exchange failed." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByLabelText("Work email")).toHaveValue("jordan@fabrikam.com");
  });

  it("renders technical detail as plain text without interpreting HTML", () => {
    render(<AuthCallbackAccessPanel technicalDetail={'<img src=x onerror="alert(1)">' } />);

    const detail = screen.getByTestId("auth-callback-technical-detail");

    expect(detail.textContent).toBe('<img src=x onerror="alert(1)">');
    expect(detail.querySelector("img")).toBeNull();
  });

  it("shows success when the API returns HTTP 200 with a JSON error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ error: "send_failed" }, { status: 200 })),
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

    vi.unstubAllGlobals();
  });

  it("wires report problem errorTitle to the access heading, not technicalDetail", () => {
    fatalReportProblemCapture.lastProps = null;

    render(<AuthCallbackAccessPanel technicalDetail="Token exchange failed." />);

    expect(screen.getByText("Token exchange failed.")).toBeInTheDocument();
    expect(fatalReportProblemCapture.lastProps?.errorTitle).toBe(AUTH_CALLBACK_ACCESS_HEADING);
    expect(fatalReportProblemCapture.lastProps?.errorTitle).not.toContain("Token exchange");
  });

  it("posts required fields without client-side trim in the JSON body", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Jordan Lee  " } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "  Fabrikam  " } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "  Architect  " } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      name: string;
      workEmail: string;
      company: string;
      roleTitle: string;
    };

    expect(body.name).toBe("  Jordan Lee  ");
    expect(body.company).toBe("  Fabrikam  ");
    expect(body.roleTitle).toBe("  Architect  ");
    vi.unstubAllGlobals();
  });

  it("retains form field values after cancel and reopening the request form", async () => {
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
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByLabelText("Work email")).toHaveValue("jordan@fabrikam.com");
    vi.unstubAllGlobals();
  });

  it("does not show success after cancel while submit is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    resolveFetch?.(new Response(null, { status: 204 }));

    await waitFor(() => {
      expect(screen.queryByTestId("auth-callback-access-success")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: AUTH_CALLBACK_ACCESS_HEADING })).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("does not enqueue duplicate POST when submit is activated twice before in-flight guard applies", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });

    const submitButton = screen.getByRole("button", { name: "Submit request" });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("auth-callback-access-success")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("posts empty honeypot websiteUrl string for server trimOptional normalization", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { websiteUrl: string };

    expect(body.websiteUrl).toBe("");
    vi.unstubAllGlobals();
  });

  it("clears honeypot websiteUrl when cancel closes the form", async () => {
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
    fireEvent.change(screen.getByLabelText("Website"), { target: { value: "https://spam.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByLabelText("Website")).toHaveValue("");
    expect(screen.getByLabelText("Work email")).toHaveValue("jordan@fabrikam.com");
    vi.unstubAllGlobals();
  });

  it("does not surface stale submit error after collapsing the form during an in-flight POST", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL })).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    resolveFetch?.(Response.json({ error: "send_failed" }, { status: 502 }));

    await waitFor(() => {
      expect(screen.queryByTestId("auth-callback-access-form")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.queryByText(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR)).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("dismisses the form via request access toggle while submit is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    await waitFor(() => {
      expect(screen.queryByTestId("auth-callback-access-form")).not.toBeInTheDocument();
    });

    resolveFetch?.(new Response(null, { status: 204 }));
    await waitFor(() => {
      expect(screen.queryByTestId("auth-callback-access-success")).not.toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("retains a prior submit error when the request form is toggled closed without cancel", async () => {
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

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByText(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("mentions asynchronous follow-up on the success view", async () => {
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

    expect(screen.getByText(AUTH_CALLBACK_ACCESS_SUCCESS_BODY)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("omits technical detail paragraph when technicalDetail is blank", () => {
    render(<AuthCallbackAccessPanel technicalDetail="" />);

    expect(screen.queryByTestId("auth-callback-technical-detail")).not.toBeInTheDocument();
  });

  it("retains duplicate-email error when the request form is toggled closed without cancel", async () => {
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

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByText(AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("keeps required field drafts when dismiss clears only the honeypot website field", async () => {
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
    fireEvent.change(screen.getByLabelText("Website"), { target: { value: "https://spam.example" } });
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByLabelText("Website")).toHaveValue("");
    expect(screen.getByLabelText("Name")).toHaveValue("Jordan Lee");
    expect(screen.getByLabelText("Company")).toHaveValue("Fabrikam");
    vi.unstubAllGlobals();
  });

  it("reflects updated technicalDetail prop while the access form is open", () => {
    const { rerender: rerenderPanel } = render(<AuthCallbackAccessPanel technicalDetail="First failure." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    expect(screen.getByTestId("auth-callback-technical-detail")).toHaveTextContent("First failure.");

    rerenderPanel(<AuthCallbackAccessPanel technicalDetail="Refreshed failure detail." />);

    expect(screen.getByTestId("auth-callback-technical-detail")).toHaveTextContent("Refreshed failure detail.");
  });

  it("omits request access control on the success view", async () => {
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

    expect(screen.queryByTestId("auth-callback-request-access")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: AUTH_CALLBACK_ACCESS_REQUEST_ACTION })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("posts access request with Accept application/json header", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = requestInit.headers as Record<string, string>;

    expect(headers.Accept).toBe("application/json");
    vi.unstubAllGlobals();
  });

  it("surfaces duplicate error again when the collapsed form is reopened", async () => {
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

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    expect(screen.queryByText(AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    expect(screen.getByText(AUTH_CALLBACK_ACCESS_DUPLICATE_ERROR)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("exposes submit errors with role alert", async () => {
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
      expect(screen.getByRole("alert")).toHaveTextContent(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR);
    });

    vi.unstubAllGlobals();
  });

  it("keeps try again navigation enabled while submit is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL })).toBeDisabled();
    });

    const tryAgainLink = screen.getByRole("link", { name: AUTH_CALLBACK_ACCESS_TRY_AGAIN_ACTION });
    expect(tryAgainLink).not.toHaveAttribute("aria-disabled", "true");
    expect(tryAgainLink).toHaveAttribute("href", "/auth/signin");

    resolveFetch?.(new Response(null, { status: 204 }));
    vi.unstubAllGlobals();
  });

  it("keeps honeypot website field in the DOM inside an aria-hidden container", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    const websiteInput = screen.getByLabelText("Website");
    expect(websiteInput).toHaveAttribute("name", "websiteUrl");
    expect(websiteInput.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("uses generic submit error copy when fetch rejects with a network TypeError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
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

  it("renders padded technical detail copy without an extra blank helper block", () => {
    render(<AuthCallbackAccessPanel technicalDetail="  Token exchange failed.  " />);

    const detail = screen.getByTestId("auth-callback-technical-detail");
    expect(detail).toBeInTheDocument();
    expect(detail.textContent?.trim()).toBe("Token exchange failed.");
  });

  it("keeps optional fields editable while submit is in flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL })).toBeDisabled();
    });

    expect(screen.getByLabelText("Cloud / platform focus (optional)")).not.toHaveAttribute("disabled");
    expect(screen.getByLabelText("Brief note (optional)")).not.toHaveAttribute("disabled");

    resolveFetch?.(new Response(null, { status: 204 }));
    vi.unstubAllGlobals();
  });

  it("omits report problem support on the success view", async () => {
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

    expect(screen.queryByTestId("fatal-page-report-problem-row")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("posts non-ASCII text in the JSON access request body", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Renée Müller" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Société Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { name: string; company: string };

    expect(body.name).toBe("Renée Müller");
    expect(body.company).toBe("Société Fabrikam");
    expect(requestInit.headers).toMatchObject({ "Content-Type": "application/json" });
    vi.unstubAllGlobals();
  });

  it("keeps the request access button label when the form is open", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByTestId("auth-callback-request-access")).toHaveTextContent(AUTH_CALLBACK_ACCESS_REQUEST_ACTION);
  });

  it("snapshots optional note in the POST body at submit start even if the field changes during flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.change(screen.getByLabelText("Brief note (optional)"), { target: { value: "First draft" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText("Brief note (optional)"), { target: { value: "Edited during flight" } });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { note: string | null };

    expect(body.note).toBe("First draft");

    resolveFetch?.(new Response(null, { status: 204 }));
    vi.unstubAllGlobals();
  });

  it("does not expose aria-expanded on the request access toggle button", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    const toggle = screen.getByTestId("auth-callback-request-access");
    fireEvent.click(toggle);

    expect(toggle).not.toHaveAttribute("aria-expanded");
  });

  it("posts empty required fields when native constraint validation is bypassed", async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: "validation_failed" }, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.submit(screen.getByTestId("auth-callback-access-form"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { name: string; workEmail: string };

    expect(body.name).toBe("");
    expect(body.workEmail).toBe("");
    vi.unstubAllGlobals();
  });

  it("uses outline styling for back to sign in on the success view", async () => {
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

    const backLink = screen.getByRole("link", { name: AUTH_CALLBACK_ACCESS_BACK_TO_SIGN_IN_ACTION });
    expect(backLink.className).toContain("border");
    vi.unstubAllGlobals();
  });

  it("omits technical detail paragraph when technicalDetail is whitespace only", () => {
    render(<AuthCallbackAccessPanel technicalDetail="   " />);

    expect(screen.queryByTestId("auth-callback-technical-detail")).not.toBeInTheDocument();
  });

  it("inserts a newline in the note field when Enter is pressed without submitting", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    const noteField = screen.getByLabelText("Brief note (optional)");
    fireEvent.change(noteField, { target: { value: "Line one" } });
    fireEvent.keyDown(noteField, { key: "Enter", code: "Enter" });
    fireEvent.change(noteField, { target: { value: "Line one\n" } });

    expect(noteField).toHaveValue("Line one\n");
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("keeps report problem support visible when the access form is expanded", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("auth-callback-access-form")).toBeInTheDocument();
  });

  it("does not post access request when work email fails HTML5 validation", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("does not post access request when a required field contains control or bidi-format characters", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan\u0000Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect\u202e" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(AUTH_CALLBACK_ACCESS_SUBMIT_ERROR);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("clears submitting state after duplicate response so the operator can retry", async () => {
    const fetchMock = vi.fn(async () => Response.json({ error: "duplicate_recent" }, { status: 409 }));
    vi.stubGlobal("fetch", fetchMock);

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

    expect(screen.getByRole("button", { name: "Submit request" })).not.toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    vi.unstubAllGlobals();
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

  it("snapshots work email in the POST body at submit start even if the field changes during flight", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "other@fabrikam.com" } });

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as { workEmail: string };

    expect(body.workEmail).toBe("jordan@fabrikam.com");

    resolveFetch?.(new Response(null, { status: 204 }));
    vi.unstubAllGlobals();
  });

  it("retains note field edits made during flight after collapsing the form", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: AUTH_CALLBACK_ACCESS_SUBMITTING_LABEL })).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Brief note (optional)"), { target: { value: "Edited during flight" } });
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByLabelText("Brief note (optional)")).toHaveValue("Edited during flight");

    resolveFetch?.(new Response(null, { status: 204 }));
    vi.unstubAllGlobals();
  });

  it("does not expose aria-controls on the request access toggle button", () => {
    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));

    expect(screen.getByTestId("auth-callback-request-access")).not.toHaveAttribute("aria-controls");
  });

  it("posts access requests via fetch rather than native form method", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    const form = screen.getByTestId("auth-callback-access-form");

    expect(form).not.toHaveAttribute("method");

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/access-requests",
        expect.objectContaining({ method: "POST" }),
      );
    });

    vi.unstubAllGlobals();
  });

  it("uses a non-submit cancel button that does not post the access form", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<AuthCallbackAccessPanel technicalDetail="Sign-in was blocked." />);

    fireEvent.click(screen.getByTestId("auth-callback-request-access"));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Jordan Lee" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "jordan@fabrikam.com" } });
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Fabrikam" } });
    fireEvent.change(screen.getByLabelText("Role / title"), { target: { value: "Architect" } });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toHaveAttribute("type", "button");

    fireEvent.click(cancelButton);

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
