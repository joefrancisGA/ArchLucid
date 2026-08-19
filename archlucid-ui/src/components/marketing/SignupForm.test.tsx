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

import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
  it("disables submit until required fields are valid (TB-2010)", () => {
    render(<SignupForm />);

    expect(screen.getByRole("button", { name: /Create evaluation workspace/i })).toBeDisabled();
    expect(screen.getByTestId("signup-form-readiness")).toHaveTextContent(/work email/i);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("submits valid payload to the same-origin proxy", async () => {
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
});
