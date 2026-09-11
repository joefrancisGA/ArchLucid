import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: pushMock }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { showError, showSuccess } from "@/lib/toast";
import { SignupForm } from "./SignupForm";

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "ops@example.com" } });
  fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Ops User" } });
  fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });
}

describe("SignupForm", () => {
  it("disables submit until required fields are valid (TB-2010)", () => {
    render(<SignupForm />);

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/work email/i);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("submits valid payload to the same-origin proxy", async () => {
    vi.mocked(showSuccess).mockClear();

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          defaultWorkspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          defaultProjectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          wasAlreadyProvisioned: false,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "ops@example.com" } });
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Ops User" } });
    fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/proxy/v1/register");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.adminEmail).toBe("ops@example.com");
    expect(body.organizationName).toBe("Contoso Trial Org");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("/signup/verify?email="));
    });

    expect(showSuccess).toHaveBeenCalledWith(
      "Organization created — check your email if verification is required.",
    );

    expect(body.baselineReviewCycleHours).toBeUndefined();
    expect(body.baselineReviewCycleSource).toBeUndefined();

    vi.unstubAllGlobals();
  });

  it("keeps optional fields behind Tell us a little more", () => {
    render(<SignupForm />);

    expect(screen.getByText("Tell us a little more")).toBeInTheDocument();
    expect(screen.queryByText(/docs\/PILOT_ROI_MODEL/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Back$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to pricing/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Tell us a little more"));

    expect(screen.getByLabelText(/Company size/i)).toBeInTheDocument();
  });

  it("shows inline email validation without a toast and keeps submit disabled", async () => {
    vi.mocked(showError).mockClear();

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "not-an-email" } });
    fireEvent.blur(screen.getByLabelText(/Work email/i));

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    expect(showError).not.toHaveBeenCalled();
  });

  it("shows a toast for duplicate organization conflict without leaving submit stuck", async () => {
    vi.mocked(showError).mockClear();
    vi.mocked(showSuccess).mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 409 })),
    );

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Signup", "That organization name is already registered.");
    });

    expect(showSuccess).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();

    vi.unstubAllGlobals();
  });

  it("shows a toast with server detail for non-ok register responses", async () => {
    vi.mocked(showError).mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ detail: "Registration is temporarily unavailable." }, { status: 503 }),
      ),
    );

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Signup", "Registration is temporarily unavailable.");
    });

    vi.unstubAllGlobals();
  });

  it("shows a toast when register fetch throws", async () => {
    vi.mocked(showError).mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("Network down");
      }),
    );

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Signup", "Network down");
    });

    vi.unstubAllGlobals();
  });

  it("re-enables submit after switching away from Other with an overlong specification", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Other")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Other"));
    fireEvent.change(screen.getByTestId("signup-industry-specify"), {
      target: { value: "A".repeat(201) },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Technology")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Technology"));

    await waitFor(() => {
      expect(screen.queryByTestId("signup-industry-specify")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });
  });

  it("keeps submit disabled when industry Other is selected without a specification", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Other")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Other"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-specify")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });
  });

  it("keeps submit disabled for invalid optional architecture team size", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.change(screen.getByTestId("signup-architecture-team-size"), { target: { value: "0" } });

    await waitFor(() => {
      expect(screen.getByText(/between 1 and 10,000/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
  });

  it("keeps submit disabled when required fields are whitespace-only", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "   " } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/work email/i);
  });

  it("keeps submit disabled when organization name exceeds 200 characters", async () => {
    render(<SignupForm />);

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Organization name/i), {
      target: { value: "A".repeat(201) },
    });

    await waitFor(() => {
      expect(screen.getByText(/at most 200 characters/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
  });

  it("keeps submit disabled when full name exceeds 200 characters", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "ops@example.com" } });
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "A".repeat(201) } });
    fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });

    await waitFor(() => {
      expect(screen.getByText(/at most 200 characters/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
  });

  it("keeps submit disabled when optional architecture team size exceeds 10000", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.change(screen.getByTestId("signup-architecture-team-size"), { target: { value: "10001" } });

    await waitFor(() => {
      expect(screen.getByText(/between 1 and 10,000/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
  });

  it("keeps submit disabled when industry Other has whitespace-only specification", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Other")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Other"));
    fireEvent.change(screen.getByTestId("signup-industry-specify"), { target: { value: "   " } });

    await waitFor(() => {
      expect(screen.getByText(/specify your industry/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });
  });

  it("disables submit and shows Creating while register request is in flight", async () => {
    let resolveFetch: (value: Response) => void = () => undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
    });

    resolveFetch(
      new Response(
        JSON.stringify({
          tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    vi.unstubAllGlobals();
  });

  it("shows inline validation on keyboard submit without calling fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(showError).mockClear();

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "bad-email" } });
    fireEvent.submit(screen.getByRole("button", { name: /Create evaluation workspace/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/Enter a valid email/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("does not fire a second register request when the form is submitted again while in flight", async () => {
    let resolveFetch: (value: Response) => void = () => undefined;

    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    const form = screen.getByRole("button", { name: /Create evaluation workspace/i }).closest("form")!;

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    resolveFetch(
      new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.unstubAllGlobals();
  });

  it("shows email-specific readiness when required fields are filled but email is invalid", async () => {
    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Ops User" } });
    fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/valid work email/i);
  });

  it("shows overlong-industry readiness when Other specification exceeds 200 characters", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Other")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Other"));
    fireEvent.change(screen.getByTestId("signup-industry-specify"), {
      target: { value: "A".repeat(201) },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/200 characters/i);
    expect(screen.getByTestId("signup-form-readiness")).not.toHaveTextContent(/specify your industry/i);
  });

  it("shows whole-number readiness when optional architecture team size is fractional", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.change(screen.getByTestId("signup-architecture-team-size"), { target: { value: "3.5" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/whole-number/i);
    expect(screen.getByTestId("signup-form-readiness")).not.toHaveTextContent(/between 1 and 10,000/i);
  });

  it("shows industry readiness when Other is selected without a specification", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Other")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Other"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/industry/i);
  });

  it("keeps submit disabled for fractional optional architecture team size", async () => {
    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.change(screen.getByTestId("signup-architecture-team-size"), { target: { value: "3.5" } });

    await waitFor(() => {
      expect(screen.getByText(/whole number when provided/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });
  });

  it("does not send fractional optional architecture team size in the register payload", async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.change(screen.getByTestId("signup-architecture-team-size"), { target: { value: "3.5" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    fireEvent.submit(screen.getByRole("button", { name: /Create evaluation workspace/i }).closest("form")!);

    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("omits whitespace-only optional architecture team size from the register payload", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          defaultWorkspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.change(screen.getByTestId("signup-architecture-team-size"), { target: { value: "   " } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.architectureTeamSize).toBeUndefined();

    vi.unstubAllGlobals();
  });
});
