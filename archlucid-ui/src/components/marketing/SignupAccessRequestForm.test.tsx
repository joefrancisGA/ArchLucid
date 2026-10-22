import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import { SignupAccessRequestForm } from "@/components/marketing/SignupAccessRequestForm";
import { SIGNUP_INVITE_ONLY_SUBMIT_LABEL, SIGNUP_INVITE_ONLY_THANKS } from "@/lib/signup-invite-only-copy";

describe("SignupAccessRequestForm", () => {
  it("requires a valid email before enabling submit", () => {
    render(<SignupAccessRequestForm />);

    const submit = screen.getByRole("button", { name: SIGNUP_INVITE_ONLY_SUBMIT_LABEL });
    const email = screen.getByLabelText(/Work email/i);

    expect(submit).toBeDisabled();

    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.blur(email);

    expect(submit).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/valid work email/i);

    fireEvent.change(email, { target: { value: "architect@example.com" } });

    expect(submit).toBeEnabled();
  });

  it("shows thanks with role=status after successful submit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "",
      }),
    );

    render(<SignupAccessRequestForm />);

    fireEvent.change(screen.getByLabelText(/Work email/i), { target: { value: "architect@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: SIGNUP_INVITE_ONLY_SUBMIT_LABEL }));

    const thanks = await waitFor(() => screen.getByTestId("signup-access-request-thanks"));

    expect(thanks).toHaveAttribute("role", "status");
    expect(thanks).toHaveTextContent(SIGNUP_INVITE_ONLY_THANKS);

    vi.unstubAllGlobals();
  });
});
