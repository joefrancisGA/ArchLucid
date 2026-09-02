import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuickScanClient } from "@/app/(marketing)/quick-scan/QuickScanClient";
import {
  QUICK_SCAN_LAST_REVIEWED_LABEL,
  QUICK_SCAN_PRIMARY_CONTENT_ID,
} from "@/app/(marketing)/quick-scan/quick-scan-page-content";

vi.mock("@/lib/quick-scan/quick-scan-telemetry", () => ({
  trackQuickScanConversionClick: vi.fn(),
  trackQuickScanSampleViewed: vi.fn(),
}));

vi.mock("@/components/auth/TurnstileBotChallenge", () => ({
  TurnstileBotChallenge: () => <div data-testid="turnstile-bot-challenge" />,
}));

vi.mock("@/lib/auth/turnstile-config", () => ({
  isTurnstileBotChallengeConfigured: vi.fn(() => true),
  readTurnstileSiteKey: vi.fn(() => "site-key-test"),
}));

import { isTurnstileBotChallengeConfigured } from "@/lib/auth/turnstile-config";

describe("QuickScanClient", () => {
  it("renders layout-pass chrome without pristine field errors", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          capacityAvailable: true,
          requireSignIn: false,
          sampleResultAvailable: true,
        }),
      }),
    );

    render(<QuickScanClient />);

    const heroHeading = screen.getByRole("heading", { name: /^Quick scan$/i, level: 1 });

    expect(heroHeading).toBeInTheDocument();
    expect(heroHeading.className).toContain("lg:text-5xl");
    expect(screen.getByTestId("quick-scan-hero")).toBeInTheDocument();
    expect(screen.getByTestId("see-it-deliverable-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-scan-hero-meta")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Skip to quick scan content/i })).toHaveAttribute(
      "href",
      `#${QUICK_SCAN_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("quick-scan-page-meta")).toHaveTextContent(QUICK_SCAN_LAST_REVIEWED_LABEL);
    expect(screen.getByTestId("quick-scan-scope-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("trust-center-revision-history")).toBeInTheDocument();
    expect(document.getElementById("quick-scan-system-name-error")).toBeNull();

    fireEvent.blur(screen.getByLabelText(/System name/i));

    expect(document.getElementById("quick-scan-system-name-error")).toHaveTextContent("System name is required.");
  });

  it("capacity banner sign-in link returns to quick scan after authentication", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          enabled: true,
          capacityAvailable: false,
          requireSignIn: true,
          sampleResultAvailable: true,
          capacityState: "AnonymousLimit",
          capacityStateMessage: "You have reached the anonymous Quick Scan limit.",
        }),
      }),
    );

    render(<QuickScanClient />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
        "href",
        "/auth/signin?returnUrl=%2Fquick-scan",
      );
    });
  });

  it("mounts Turnstile challenge after QUICK_SCAN_CAPTCHA_REQUIRED response", async () => {
    vi.mocked(isTurnstileBotChallengeConfigured).mockReturnValue(true);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          enabled: true,
          capacityAvailable: true,
          requireSignIn: false,
          sampleResultAvailable: true,
          capacityState: "Available",
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () =>
          JSON.stringify({
            detail: "Complete the security check to continue with Quick Scan.",
            extensions: { errorCode: "QUICK_SCAN_CAPTCHA_REQUIRED" },
          }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<QuickScanClient />);

    fireEvent.change(screen.getByLabelText(/System name/i), { target: { value: "Contoso" } });
    fireEvent.change(screen.getByLabelText(/Primary environment/i), { target: { value: "Azure" } });
    fireEvent.change(screen.getByLabelText(/Describe the system/i), {
      target: { value: "A multi-region workflow with audit logging." },
    });

    await waitFor(() => {
      expect(screen.getByTestId("quick-scan-submit")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByTestId("quick-scan-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("quick-scan-captcha-challenge")).toBeInTheDocument();
      expect(screen.getByTestId("turnstile-bot-challenge")).toBeInTheDocument();
    });
  });
});
