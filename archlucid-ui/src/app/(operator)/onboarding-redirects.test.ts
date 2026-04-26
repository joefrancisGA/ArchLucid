import { permanentRedirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  permanentRedirect: vi.fn(),
}));

import OnboardRedirectPage from "./onboard/page";
import OnboardingRedirectPage from "./onboarding/page";
import OnboardingStartRedirectPage from "./onboarding/start/page";

describe("legacy onboarding routes permanent-redirect (308) to /getting-started", () => {
  beforeEach(() => {
    vi.mocked(permanentRedirect).mockClear();
  });

  it("redirects /onboarding to /getting-started", async () => {
    await OnboardingRedirectPage({ searchParams: Promise.resolve({}) });
    expect(permanentRedirect).toHaveBeenCalledWith("/getting-started");
  });

  it("redirects /onboarding and preserves query", async () => {
    await OnboardingRedirectPage({
      searchParams: Promise.resolve({ source: "registration" }),
    });
    expect(permanentRedirect).toHaveBeenCalledWith("/getting-started?source=registration");
  });

  it("redirects /onboard to /getting-started", async () => {
    await OnboardRedirectPage({ searchParams: Promise.resolve({}) });
    expect(permanentRedirect).toHaveBeenCalledWith("/getting-started");
  });

  it("redirects /onboard and preserves query", async () => {
    await OnboardRedirectPage({ searchParams: Promise.resolve({ trial: "1" }) });
    expect(permanentRedirect).toHaveBeenCalledWith("/getting-started?trial=1");
  });

  it("redirects /onboarding/start to /getting-started and preserves query", async () => {
    await OnboardingStartRedirectPage({
      searchParams: Promise.resolve({ source: "registration" }),
    });
    expect(permanentRedirect).toHaveBeenCalledWith("/getting-started?source=registration");
  });

  it("redirects /onboarding/start and preserves multiple query keys", async () => {
    await OnboardingStartRedirectPage({
      searchParams: Promise.resolve({ source: "registration", foo: "bar" }),
    });
    const call = vi.mocked(permanentRedirect).mock.calls[0]?.[0] as string;
    expect(call.startsWith("/getting-started?")).toBe(true);
    expect(call).toContain("source=registration");
    expect(call).toContain("foo=bar");
  });
});
