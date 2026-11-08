import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
const permanentRedirect = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    redirect: (target: string) => {
      redirect(target);
      throw new Error(`redirect:${target}`);
    },
    permanentRedirect: (target: string) => {
      permanentRedirect(target);
      throw new Error(`permanentRedirect:${target}`);
    },
  };
});

import GovernanceDashboardPage from "./page";

describe("GovernanceDashboardPage", () => {
  it("temporarily redirects legacy bookmarks to workspace health", async () => {
    redirect.mockClear();
    permanentRedirect.mockClear();

    await expect(
      GovernanceDashboardPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("redirect:/insights/workspace-health");

    expect(redirect).toHaveBeenCalledWith("/insights/workspace-health");
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it("preserves query params without a permanent redirect", async () => {
    redirect.mockClear();
    permanentRedirect.mockClear();

    await expect(
      GovernanceDashboardPage({
        searchParams: Promise.resolve({ utm_source: "email", status: "Open" }),
      }),
    ).rejects.toThrow("redirect:/insights/workspace-health?utm_source=email&status=Open");

    expect(redirect).toHaveBeenCalledWith("/insights/workspace-health?utm_source=email&status=Open");
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it("preserves repeated query keys without a permanent redirect", async () => {
    redirect.mockClear();
    permanentRedirect.mockClear();

    await expect(
      GovernanceDashboardPage({
        searchParams: Promise.resolve({ tab: ["one", "two"], status: undefined }),
      }),
    ).rejects.toThrow("redirect:/insights/workspace-health?tab=one&tab=two");

    expect(redirect).toHaveBeenCalledWith("/insights/workspace-health?tab=one&tab=two");
    expect(permanentRedirect).not.toHaveBeenCalled();
  });
});
