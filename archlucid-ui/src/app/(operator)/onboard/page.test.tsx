import { describe, expect, it, vi } from "vitest";

import { buildOnboardingRedirectPath } from "@/lib/legacy-onboarding-redirect";

const permanentRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  permanentRedirect: (target: string) => {
    permanentRedirect(target);
    throw new Error(`permanentRedirect:${target}`);
  },
}));

import OnboardRedirectPage from "./page";

describe("OnboardRedirectPage (TB-1796)", () => {
  it("permanently redirects bare bookmarks to /onboarding", async () => {
    permanentRedirect.mockClear();

    await expect(OnboardRedirectPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "permanentRedirect:/onboarding",
    );

    expect(permanentRedirect).toHaveBeenCalledWith("/onboarding");
  });

  it("preserves scalar and repeated query params on redirect", async () => {
    permanentRedirect.mockClear();
    const params = { source: "registration", tag: ["a", "b"] };

    await expect(OnboardRedirectPage({ searchParams: Promise.resolve(params) })).rejects.toThrow(
      `permanentRedirect:${buildOnboardingRedirectPath(params)}`,
    );

    const target = permanentRedirect.mock.calls[0]?.[0] as string;
    expect(target).toContain("/onboarding?");
    expect(target).toContain("source=registration");
    expect(target).toContain("tag=a");
    expect(target).toContain("tag=b");
  });
});
