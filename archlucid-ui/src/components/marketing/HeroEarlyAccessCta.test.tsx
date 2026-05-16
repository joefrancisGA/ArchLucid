import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("utm_source=src&utm_medium=med&utm_campaign=cmp"),
}));

import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

import { HeroEarlyAccessCta } from "./HeroEarlyAccessCta";

describe("HeroEarlyAccessCta", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(null, { status: 204 });
      }),
    );
    window.localStorage.setItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    const clarity = vi.fn();
    (window as Window & { clarity?: typeof clarity }).clarity = clarity;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.removeItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY);
    delete (window as Window & { clarity?: typeof vi.fn }).clarity;
  });

  it("POSTs early-access payload with UTM fields and emits Clarity only after success", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);

    render(<HeroEarlyAccessCta source="hero" />);

    fireEvent.click(screen.getByRole("button", { name: /join early access/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /work email/i }), {
      target: { value: "lead@Example.ORG" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [url, init] = firstCall as [string, RequestInit];
    expect(url).toContain("/api/proxy/v1/marketing/early-access");
    expect(init.method).toBe("POST");

    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.email).toBe("lead@Example.ORG");
    expect(body.utmSource).toBe("src");
    expect(body.utmMedium).toBe("med");
    expect(body.utmCampaign).toBe("cmp");

    const clarity = (window as Window & { clarity: ReturnType<typeof vi.fn> }).clarity;
    expect(clarity.mock.calls.some((c) => c[0] === "event" && c[1] === "cta_early_access_submit")).toBe(true);
    expect(
      clarity.mock.calls.some((c) => c[0] === "set" && c[1] === "cta_email_domain" && c[2] === "example.org"),
    ).toBe(true);

    expect(screen.getByTestId("welcome-early-access-thanks")).toHaveTextContent(/follow up within 2 business days/i);
  });

  it("does not emit Clarity when POST fails", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(new Response("bad", { status: 400 }));

    render(<HeroEarlyAccessCta />);

    fireEvent.click(screen.getByRole("button", { name: /join early access/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /work email/i }), {
      target: { value: "x@y.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const clarity = (window as Window & { clarity: ReturnType<typeof vi.fn> }).clarity;
    expect(clarity.mock.calls.some((c) => c[0] === "event" && c[1] === "cta_early_access_submit")).toBe(false);
  });
});
