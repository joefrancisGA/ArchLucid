import { describe, expect, it, vi } from "vitest";

import { buildQuickStartRedirectPath } from "@/lib/legacy-quick-start-redirect";

const permanentRedirect = vi.fn();

vi.mock("next/navigation", () => ({
  permanentRedirect: (target: string) => {
    permanentRedirect(target);
    throw new Error(`permanentRedirect:${target}`);
  },
}));

import QuickStartRedirectPage from "./page";

describe("QuickStartRedirectPage (TB-1816)", () => {
  it("permanently redirects bookmarks to /get-started with query preserved", async () => {
    permanentRedirect.mockClear();
    const params = { source: "email", utm_campaign: "launch" };

    await expect(QuickStartRedirectPage({ searchParams: Promise.resolve(params) })).rejects.toThrow(
      `permanentRedirect:${buildQuickStartRedirectPath(params)}`,
    );

    expect(permanentRedirect).toHaveBeenCalledWith(
      "/get-started?source=email&utm_campaign=launch",
    );
  });
});
