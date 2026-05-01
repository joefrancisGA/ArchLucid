import { permanentRedirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn(),
}));

import OnboardRedirectPage from "./onboard/page";
import GettingStartedRedirectPage from "./getting-started/page";
import OnboardingStartRedirectPage from "./onboarding/start/page";

describe("legacy onboarding routes permanent-redirect (308) to /onboarding", () => {
  beforeEach(() => {
    vi.mocked(permanentRedirect).mockClear();
  });

  it("redirects /getting-started to /onboarding", async () => {
    await GettingStartedRedirectPage({ searchParams: Promise.resolve({}) });
    expect(permanentRedirect).toHaveBeenCalledWith("/onboarding");
  });

  it("redirects /getting-started and preserves query", async () => {
    await GettingStartedRedirectPage({
      searchParams: Promise.resolve({ source: "registration" }),
    });
    expect(permanentRedirect).toHaveBeenCalledWith("/onboarding?source=registration");
  });

  it("redirects /onboard to /onboarding", async () => {
    await OnboardRedirectPage({ searchParams: Promise.resolve({}) });
    expect(permanentRedirect).toHaveBeenCalledWith("/onboarding");
  });

  it("redirects /onboard and preserves query", async () => {
    await OnboardRedirectPage({ searchParams: Promise.resolve({ trial: "1" }) });
    expect(permanentRedirect).toHaveBeenCalledWith("/onboarding?trial=1");
  });

  it("redirects /onboarding/start to /onboarding and preserves query", async () => {
    await OnboardingStartRedirectPage({
      searchParams: Promise.resolve({ source: "registration" }),
    });
    expect(permanentRedirect).toHaveBeenCalledWith("/onboarding?source=registration");
  });

  it("redirects /onboarding/start and preserves multiple query keys", async () => {
    await OnboardingStartRedirectPage({
      searchParams: Promise.resolve({ source: "registration", foo: "bar" }),
    });
    const call = vi.mocked(permanentRedirect).mock.calls[0]?.[0] as string;
    expect(call.startsWith("/onboarding?")).toBe(true);
    expect(call).toContain("source=registration");
    expect(call).toContain("foo=bar");
  });
});
