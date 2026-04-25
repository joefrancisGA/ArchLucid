import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import OnboardRedirectPage from "./onboard/page";
import OnboardingRedirectPage from "./onboarding/page";
import OnboardingStartRedirectPage from "./onboarding/start/page";

describe("legacy onboarding routes redirect to /getting-started", () => {
  beforeEach(() => {
    vi.mocked(redirect).mockClear();
  });

  it("redirects /onboarding to /getting-started", () => {
    OnboardingRedirectPage();
    expect(redirect).toHaveBeenCalledWith("/getting-started");
  });

  it("redirects /onboard to /getting-started", () => {
    OnboardRedirectPage();
    expect(redirect).toHaveBeenCalledWith("/getting-started");
  });

  it("redirects /onboarding/start to /getting-started and preserves query", async () => {
    await OnboardingStartRedirectPage({
      searchParams: Promise.resolve({ source: "registration" }),
    });
    expect(redirect).toHaveBeenCalledWith("/getting-started?source=registration");
  });

  it("redirects /onboarding/start and preserves multiple query keys", async () => {
    await OnboardingStartRedirectPage({
      searchParams: Promise.resolve({ source: "registration", foo: "bar" }),
    });
    const call = vi.mocked(redirect).mock.calls[0]?.[0] as string;
    expect(call.startsWith("/getting-started?")).toBe(true);
    expect(call).toContain("source=registration");
    expect(call).toContain("foo=bar");
  });
});
