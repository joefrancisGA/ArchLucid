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

import * as firstTenantFunnelTelemetry from "@/lib/first-tenant-funnel-telemetry";
import { signupFormSchema, type SignupFormValues } from "@/lib/signup-schema";
import { showError, showSuccess } from "@/lib/toast";
import { buildSignupRegisterPayload, SignupForm } from "./SignupForm";

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "ops@example.com" } });
  fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Ops User" } });
  fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });
}

describe("SignupForm", () => {
  it("omits non-integer optional architecture team size from the register payload builder", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "3.5",
    });

    expect(payload.architectureTeamSize).toBeUndefined();
  });

  it("omits industry vertical other from the register payload builder when industry is not Other", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      industryVertical: "Technology",
      industryVerticalOther: "Should not ship",
    });

    expect(payload.industryVertical).toBe("Technology");
    expect(payload.industryVerticalOther).toBeUndefined();
  });

  it("includes maximum valid optional architecture team size in the register payload builder", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "10000",
    });

    expect(payload.architectureTeamSize).toBe(10_000);
  });

  it("omits empty company size string from the register payload builder", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      companySize: "",
    });

    expect(payload.companySize).toBeUndefined();
  });

  it("serializes scientific notation optional architecture team size when it parses to a whole number", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "1e3",
    });

    expect(payload.architectureTeamSize).toBe(1000);
  });

  it("serializes 1e4 optional architecture team size at the upper bound in the register payload builder", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "1e4",
    });

    expect(payload.architectureTeamSize).toBe(10_000);
  });

  it("passes through padded required fields when the register payload builder is called directly", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "  ops@example.com  ",
      adminDisplayName: "  Ops User  ",
      organizationName: "  Contoso Trial Org  ",
    });

    expect(payload.adminEmail).toBe("  ops@example.com  ");
    expect(payload.adminDisplayName).toBe("  Ops User  ");
    expect(payload.organizationName).toBe("  Contoso Trial Org  ");
  });

  it("signupFormSchema accepts leading-zero optional architecture team size as decimal ten", () => {
    const parsed = signupFormSchema.safeParse({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "010",
    });

    expect(parsed.success).toBe(true);
  });

  it("serializes leading-zero optional architecture team size as ten in the register payload builder", () => {
    const payload = buildSignupRegisterPayload({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "010",
    });

    expect(payload.architectureTeamSize).toBe(10);
  });

  it("omits industry vertical from the register payload builder when industry is an empty string", () => {
    const values = {
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      industryVertical: "",
      industryVerticalOther: "Should not ship without enum Other",
    } as SignupFormValues;

    const payload = buildSignupRegisterPayload(values);

    expect(payload.industryVertical).toBeUndefined();
    expect(payload.industryVerticalOther).toBeUndefined();
  });

  it("signupFormSchema accepts 1e4 optional architecture team size at the upper bound", () => {
    const parsed = signupFormSchema.safeParse({
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      architectureTeamSize: "1e4",
    });

    expect(parsed.success).toBe(true);
  });

  it("passes non-enum company size through the payload builder when the schema is bypassed", () => {
    const values = {
      adminEmail: "ops@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
      companySize: "not-a-real-enum",
    } as SignupFormValues;

    const payload = buildSignupRegisterPayload(values);

    expect(payload.companySize).toBe("not-a-real-enum");
  });

  it("disables native html5 validation on the signup form", () => {
    render(<SignupForm />);

    const form = document.querySelector("form");

    expect(form).not.toBeNull();
    expect(form).toHaveAttribute("novalidate");
  });

  it("disables submit until required fields are valid (TB-2010)", () => {
    render(<SignupForm />);

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/work email/i);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not allow another register POST when success handling throws after a 201", async () => {
    vi.mocked(showError).mockClear();
    vi.mocked(showSuccess).mockImplementation(() => {
      throw new Error("toast failed");
    });

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const registerFetchCount = () =>
      fetchMock.mock.calls.filter((call) => call[0] === "/api/proxy/v1/register").length;

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Signup", "toast failed");
      expect(registerFetchCount()).toBe(1);
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Creating/i }));

    expect(registerFetchCount()).toBe(1);

    vi.mocked(showSuccess).mockReset();
    vi.unstubAllGlobals();
  });

  it("does not fire a second register request after success before navigation", async () => {
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const registerFetchCount = () =>
      fetchMock.mock.calls.filter((call) => call[0] === "/api/proxy/v1/register").length;

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalled();
      expect(registerFetchCount()).toBe(1);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Creating/i }));

    expect(registerFetchCount()).toBe(1);

    vi.unstubAllGlobals();
  });

  it("still posts register when first-touch cookie JSON is malformed", async () => {
    document.cookie = `${encodeURIComponent("archlucid.firstTouch.v1")}=${encodeURIComponent("not-json")}`;

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    document.cookie = "archlucid.firstTouch.v1=; Max-Age=0";
    vi.unstubAllGlobals();
  });

  it("still posts register when first-touch cookie contains non-Latin1 UTM values", async () => {
    const capturedUtc = "2026-10-06T00:00:00.000Z";
    const cookieValue = encodeURIComponent(
      JSON.stringify({ utm_source: "launch", utm_campaign: "🚀", capturedUtc }),
    );

    document.cookie = `archlucid.firstTouch.v1=${cookieValue}`;

    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["x-archlucid-first-touch"]).toBeUndefined();

    document.cookie = "archlucid.firstTouch.v1=; Max-Age=0";
    vi.unstubAllGlobals();
  });

  it("encodes plus-addressed email in the verify redirect query", async () => {
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "ops+alias@example.com" } });
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Ops User" } });
    fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/signup/verify?email=ops%2Balias%40example.com");
    });

    vi.unstubAllGlobals();
  });

  it("surfaces signup error when first-tenant funnel telemetry throws unexpectedly", async () => {
    vi.mocked(showError).mockClear();
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    const funnelSpy = vi
      .spyOn(firstTenantFunnelTelemetry, "recordFirstTenantFunnelEvent")
      .mockImplementation(() => {
        throw new Error("telemetry sink failed");
      });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
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
      expect(showError).toHaveBeenCalledWith("Signup", "telemetry sink failed");
      expect(showSuccess).not.toHaveBeenCalled();
      expect(pushMock).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
    });

    funnelSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("surfaces signup error when success toast throws after successful register", async () => {
    vi.mocked(showError).mockClear();
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();
    vi.mocked(showSuccess).mockImplementation(() => {
      throw new Error("toast failed");
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
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
      expect(showError).toHaveBeenCalledWith("Signup", "toast failed");
      expect(pushMock).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
    });

    vi.mocked(showSuccess).mockReset();
    vi.unstubAllGlobals();
  });

  it("signupFormSchema rejects unicode local-part email before verify redirect", () => {
    const parsed = signupFormSchema.safeParse({
      adminEmail: "üser@example.com",
      adminDisplayName: "Ops User",
      organizationName: "Contoso Trial Org",
    });

    expect(parsed.success).toBe(false);
  });

  it("keeps submit disabled for unicode local-part email", async () => {
    render(<SignupForm />);
    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "üser@example.com" } });
    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Ops User" } });
    fireEvent.change(screen.getByLabelText(/Organization name/i), { target: { value: "Contoso Trial Org" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });
  });

  it("surfaces signup error when navigation throws after successful register", async () => {
    vi.mocked(showError).mockClear();
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();
    pushMock.mockImplementation(() => {
      throw new Error("navigation failed");
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
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
      expect(showSuccess).toHaveBeenCalled();
      expect(showError).toHaveBeenCalledWith("Signup", "navigation failed");
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
    });

    pushMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("navigates to verify on HTTP 200 when register response is ok", async () => {
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
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
      expect(showSuccess).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/signup/verify?email=ops%40example.com");
    });

    vi.unstubAllGlobals();
  });

  it("still navigates when sessionStorage.setItem throws during success handling", async () => {
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError", "QuotaExceededError");
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<SignupForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByText("Tell us a little more"));
    fireEvent.click(screen.getByTestId("signup-industry"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-industry-Technology")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-industry-Technology"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("/signup/verify?email="));
    });

    setItemSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("still navigates after 201 when register response body is not valid json", async () => {
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("provisioned", { status: 201 })),
    );

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showSuccess).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("/signup/verify?email="));
    });

    vi.unstubAllGlobals();
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

  it("still allows register retry after duplicate organization conflict", async () => {
    vi.mocked(showError).mockClear();
    vi.mocked(showSuccess).mockClear();
    pushMock.mockClear();

    let registerAttempt = 0;

    const fetchMock = vi.fn(async (url: string) => {
      if (url !== "/api/proxy/v1/register") {
        throw new Error(`Unexpected fetch URL: ${url}`);
      }

      registerAttempt += 1;

      if (registerAttempt === 1) {
        return new Response("", { status: 409 });
      }

      return new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const registerFetchCount = () =>
      fetchMock.mock.calls.filter((call) => call[0] === "/api/proxy/v1/register").length;

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith("Signup", "That organization name is already registered.");
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(registerFetchCount()).toBe(2);
      expect(showSuccess).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("/signup/verify?email="));
    });

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
      expect(screen.getByRole("button", { name: /Creating/i })).toBeDisabled();
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

  it("does not fire a second register request on rapid double-click before submitting state updates", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(
            () =>
              resolve(
                new Response(JSON.stringify({ tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }), {
                  status: 201,
                  headers: { "Content-Type": "application/json" },
                }),
              ),
            50,
          );
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const registerFetchCount = () =>
      fetchMock.mock.calls.filter((call) => call[0] === "/api/proxy/v1/register").length;

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    const button = screen.getByRole("button", { name: /Create evaluation workspace/i });

    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(registerFetchCount()).toBe(1);
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 60);
    });

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

    const registerFetchCount = () =>
      fetchMock.mock.calls.filter((call) => call[0] === "/api/proxy/v1/register").length;

    render(<SignupForm />);
    fillRequiredFields();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeEnabled();
    });

    const form = screen.getByRole("button", { name: /Create evaluation workspace/i }).closest("form")!;

    fireEvent.click(screen.getByRole("button", { name: /Create evaluation workspace/i }));

    await waitFor(() => {
      expect(registerFetchCount()).toBe(1);
    });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(registerFetchCount()).toBe(1);
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

  it("shows overlong industry readiness when Other specification exceeds 200 characters", async () => {
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
      expect(screen.getByText(/at most 200 characters/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    });

    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/200 characters/i);
    expect(screen.getByTestId("signup-form-readiness")).not.toHaveTextContent(/specify your industry/i);
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
