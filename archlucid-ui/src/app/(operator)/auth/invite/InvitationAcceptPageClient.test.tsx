import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const validateInvitationToken = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: vi.fn(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
    usePathname: () => "/auth/invite",
  };
});

vi.mock("@/lib/auth/invitation-validation-api", () => ({
  validateInvitationToken: (...args: unknown[]) => validateInvitationToken(...args),
}));

vi.mock("@/lib/auth/email-otp-session", () => ({
  storeInvitationToken: vi.fn(),
  clearInvitationToken: vi.fn(),
}));

import { useSearchParams } from "next/navigation";

import { InvitationAcceptPageClient } from "@/app/(operator)/auth/invite/InvitationAcceptPageClient";

describe("InvitationAcceptPageClient fatal recovery", () => {
  beforeEach(() => {
    validateInvitationToken.mockReset();
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("token=invite-token") as ReturnType<typeof useSearchParams>,
    );
  });

  it("renders Report problem when invitation validation fails", async () => {
    validateInvitationToken.mockRejectedValueOnce(new Error("network"));

    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-invalid-alert")).toBeInTheDocument();
      expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    });
  });

  it("renders Report problem when invitation token is missing", async () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams() as ReturnType<typeof useSearchParams>);

    render(<InvitationAcceptPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("invitation-invalid-alert")).toBeInTheDocument();
      expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    });
  });
});
