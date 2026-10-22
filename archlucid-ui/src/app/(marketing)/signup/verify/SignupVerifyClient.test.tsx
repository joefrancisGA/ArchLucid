import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { SIGNUP_VERIFY_BANNED_CUSTOMER_STRINGS } from "@/lib/signup-verify-present";
import { SIGNUP_VERIFY_PAGE_COPY } from "@/lib/signup-verify-page-copy";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: pushMock, replace: replaceMock }),
  useSearchParams: () => new URLSearchParams("email=ops%40example.com"),
    usePathname: () => "/",
  };
});

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: vi.fn(() => false),
}));

vi.mock("@/lib/oidc/initiate-redirect", () => ({
  initiateOidcRedirect: vi.fn(async () => undefined),
}));

vi.mock("@/lib/registration-session", () => ({
  readLastRegistrationPayload: vi.fn(),
}));

vi.mock("@/lib/signup-verify-trial-status", () => ({
  fetchSignupVerifyTrialStatus: vi.fn(),
}));

vi.mock("@/lib/signup-verify-resend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/signup-verify-resend")>();

  return {
    ...actual,
    readSignupVerifyResendCooldown: vi.fn(() => ({ active: false, secondsRemaining: 0 })),
    markSignupVerifyResendSent: vi.fn(),
  };
});

import { readLastRegistrationPayload } from "@/lib/registration-session";
import { fetchSignupVerifyTrialStatus } from "@/lib/signup-verify-trial-status";
import { isJwtAuthMode } from "@/lib/oidc/config";
import { initiateOidcRedirect } from "@/lib/oidc/initiate-redirect";
import {
  markSignupVerifyResendSent,
  readSignupVerifyResendCooldown,
} from "@/lib/signup-verify-resend";
import { SignupVerifyClient } from "./SignupVerifyClient";

const registration = {
  tenantId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  defaultWorkspaceId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  defaultProjectId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  adminEmail: "ops@example.com",
  organizationName: "Contoso Trial Org",
};

function renderedText(): string {
  return document.body.textContent ?? "";
}

describe("SignupVerifyClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readLastRegistrationPayload).mockReturnValue(registration);
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({ kind: "unauthorized" });
    vi.mocked(readSignupVerifyResendCooldown).mockReturnValue({ active: false, secondsRemaining: 0 });
    vi.mocked(isJwtAuthMode).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders verification required and email sent state", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading })).toBeInTheDocument();
    });

    expect(screen.getByText(/o\*\*\*@example\.com/)).toBeInTheDocument();
    expect(screen.getByTestId("signup-verify-resend-email")).toBeInTheDocument();
  });

  it("masks the destination email in customer copy", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByText(/o\*\*\*@example\.com/)).toBeInTheDocument();
    });

    expect(screen.queryByText("ops@example.com")).not.toBeInTheDocument();
  });

  it("skips to onboarding when workspace is already ready", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({
      kind: "ready",
      payload: { status: "Active", trialWelcomeRunId: "run-1" },
    });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.emailVerifiedHeading })).toBeInTheDocument();
    });

    expect(screen.getByTestId("signup-verify-continue-onboarding")).toHaveTextContent(
      SIGNUP_VERIFY_PAGE_COPY.primaryVerified,
    );
  });

  it("allows manual continuation when verification completes", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({
      kind: "ready",
      payload: { status: "Active", trialSampleRunId: "run-1" },
    });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toHaveTextContent(
        SIGNUP_VERIFY_PAGE_COPY.primaryVerified,
      );
    });

    fireEvent.click(screen.getByTestId("signup-verify-continue-onboarding"));
    expect(pushMock).toHaveBeenCalledWith("/architecture/first-review-guide?source=registration");
  });

  it("shows loading then pending state", async () => {
    let resolveFetch!: (value: Awaited<ReturnType<typeof fetchSignupVerifyTrialStatus>>) => void;
    const pendingFetch = new Promise<Awaited<ReturnType<typeof fetchSignupVerifyTrialStatus>>>((resolve) => {
      resolveFetch = resolve;
    });
    vi.mocked(fetchSignupVerifyTrialStatus).mockReturnValue(pendingFetch);

    render(<SignupVerifyClient />);

    expect(screen.getByTestId("signup-verify-continue-onboarding")).toHaveTextContent(
      SIGNUP_VERIFY_PAGE_COPY.primaryContinueChecking,
    );

    resolveFetch({ kind: "unauthorized" });

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toHaveTextContent(
        SIGNUP_VERIFY_PAGE_COPY.primaryPending,
      );
    });
  });

  it("shows delivery failure recovery", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({ kind: "error" });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.deliveryFailedHeading })).toBeInTheDocument();
    });
  });

  it("does not show delivery failure when a background status poll errors after pending", async () => {
    vi.useFakeTimers();

    try {
      vi.mocked(fetchSignupVerifyTrialStatus)
        .mockResolvedValueOnce({ kind: "pending", payload: { status: "None" } })
        .mockResolvedValueOnce({ kind: "error" });

      render(<SignupVerifyClient />);

      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading })).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(25_000);
        await Promise.resolve();
      });

      expect(fetchSignupVerifyTrialStatus).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.deliveryFailedHeading })).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.checkInboxHeading })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("handles resend pending label", async () => {
    vi.mocked(readSignupVerifyResendCooldown).mockReturnValue({ active: false, secondsRemaining: 0 });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-resend-email")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("signup-verify-resend-email"));

    await waitFor(() => {
      expect(markSignupVerifyResendSent).toHaveBeenCalled();
    });
  });

  it("shows resend success feedback", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-resend-email")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("signup-verify-resend-email"));

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-status-message")).toHaveTextContent(
        SIGNUP_VERIFY_PAGE_COPY.resendSuccess,
      );
    });
  });

  it("shows resend cooldown message", async () => {
    vi.mocked(readSignupVerifyResendCooldown).mockReturnValue({ active: true, secondsRemaining: 45 });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-status-message")).toHaveTextContent("45 seconds");
    });

    expect(screen.getByTestId("signup-verify-resend-email")).toBeDisabled();
  });

  it("shows still-pending message after continue check", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({ kind: "pending", payload: { status: "None" } });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("signup-verify-continue-onboarding"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.stillPendingHeading })).toBeInTheDocument();
    });
  });

  it("continues to onboarding when verification is detected on primary action", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus)
      .mockResolvedValueOnce({ kind: "pending", payload: { status: "None" } })
      .mockResolvedValueOnce({
        kind: "ready",
        payload: { status: "Active", trialWelcomeRunId: "run-1" },
      });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("signup-verify-continue-onboarding"));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/architecture/first-review-guide?source=registration");
    });
  });

  it("does not continue when verification is still required", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({ kind: "pending", payload: { status: "None" } });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("signup-verify-continue-onboarding"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.stillPendingHeading })).toBeInTheDocument();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows expired signup session recovery", async () => {
    vi.mocked(readLastRegistrationPayload).mockReturnValue(null);

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.sessionExpiredHeading })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("signup-verify-continue-onboarding"));
    expect(pushMock).toHaveBeenCalledWith("/signup");
  });

  it("shows existing-account recovery", async () => {
    vi.mocked(readLastRegistrationPayload).mockReturnValue({ ...registration, wasAlreadyProvisioned: true });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: SIGNUP_VERIFY_PAGE_COPY.existingAccountHeading })).toBeInTheDocument();
    });
  });

  it("routes JWT users to sign-in when verification requires authentication", async () => {
    vi.mocked(isJwtAuthMode).mockReturnValue(true);
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({ kind: "unauthorized" });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("signup-verify-continue-onboarding"));

    await waitFor(() => {
      expect(initiateOidcRedirect).toHaveBeenCalledWith("/architecture/first-review-guide?source=registration");
    });
  });

  it("uses safe sign-in href with onboarding return path", async () => {
    vi.mocked(readLastRegistrationPayload).mockReturnValue(null);

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-sign-in")).toHaveAttribute(
        "href",
        "/auth/signin?returnUrl=%2Farchitecture%2Ffirst-review-guide%3Fsource%3Dregistration",
      );
    });
  });

  it("does not render duplicate Sign in actions in the default pending state", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-continue-onboarding")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("signup-verify-sign-in")).not.toBeInTheDocument();
  });

  it("exposes a single live status region for accessibility", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-status-region")).toHaveAttribute("aria-live", "polite");
    });
  });

  it("renders a responsive verification card shell", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-card")).toBeInTheDocument();
    });
  });

  it("does not render banned internal implementation language", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-card")).toBeInTheDocument();
    });

    const text = renderedText().toLowerCase();

    for (const banned of SIGNUP_VERIFY_BANNED_CUSTOMER_STRINGS) {
      expect(text).not.toContain(banned.toLowerCase());
    }
  });

  it("does not render API routes or HTTP methods", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-card")).toBeInTheDocument();
    });

    const text = renderedText();
    expect(text).not.toMatch(/POST\s+\/v1\//i);
    expect(text).not.toMatch(/GET\s+\/v1\//i);
  });

  it("offers use a different email recovery", async () => {
    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-different-email")).toHaveAttribute("href", "/signup");
    });
  });

  it("shows throttled status with customer-friendly cooldown copy", async () => {
    vi.mocked(fetchSignupVerifyTrialStatus).mockResolvedValue({ kind: "throttled" });

    render(<SignupVerifyClient />);

    await waitFor(() => {
      expect(screen.getByTestId("signup-verify-status-message")).toBeInTheDocument();
    });

    expect(screen.getByTestId("signup-verify-status-message").textContent?.toLowerCase()).not.toContain("rate limit");
  });
});
