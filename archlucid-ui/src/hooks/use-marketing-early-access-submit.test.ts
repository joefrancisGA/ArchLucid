import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

const searchParams = new URLSearchParams("utm_source=src&utm_medium=med&utm_campaign=cmp");

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

import { useMarketingEarlyAccessSubmit } from "@/hooks/use-marketing-early-access-submit";

describe("useMarketingEarlyAccessSubmit", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
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

  it("blocks submit until work email is valid", async () => {
    const { result } = renderHook(() => useMarketingEarlyAccessSubmit({ source: "hero" }));

    expect(result.current.canSubmit).toBe(false);

    act(() => {
      result.current.setEmail("not-an-email");
      result.current.onEmailBlur();
    });

    expect(result.current.canSubmit).toBe(false);
    expect(result.current.showEmailFormatError).toBe(true);

    act(() => {
      result.current.setEmail("architect@example.com");
    });

    expect(result.current.canSubmit).toBe(true);
  });

  it("POSTs payload with UTM fields and records Clarity after success", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    const { result } = renderHook(() => useMarketingEarlyAccessSubmit({ source: "signup" }));

    act(() => {
      result.current.setEmail("lead@Example.ORG");
      result.current.setCompanyName("Acme");
      result.current.setRole("architect");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent);
    });

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
    expect(body.companyName).toBe("Acme");
    expect(body.role).toBe("architect");
    expect(body.utmSource).toBe("src");
    expect(body.utmMedium).toBe("med");
    expect(body.utmCampaign).toBe("cmp");

    const clarity = (window as Window & { clarity: ReturnType<typeof vi.fn> }).clarity;
    expect(clarity.mock.calls.some((call) => call[0] === "event" && call[1] === "cta_early_access_submit")).toBe(true);
    expect(
      clarity.mock.calls.some((call) => call[0] === "set" && call[1] === "cta_email_domain" && call[2] === "example.org"),
    ).toBe(true);

    expect(result.current.done).toBe(true);
  });

  it("does not record Clarity when POST fails", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValueOnce(new Response("bad", { status: 400 }));

    const { result } = renderHook(() => useMarketingEarlyAccessSubmit({ source: "hero" }));

    act(() => {
      result.current.setEmail("architect@example.com");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as React.FormEvent);
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    const clarity = (window as Window & { clarity: ReturnType<typeof vi.fn> }).clarity;
    expect(clarity.mock.calls.some((call) => call[0] === "event" && call[1] === "cta_early_access_submit")).toBe(false);
    expect(result.current.done).toBe(false);
  });
});
