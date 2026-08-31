import { describe, expect, it, vi } from "vitest";

const permanentRedirect = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    permanentRedirect: (target: string) => {
      permanentRedirect(target);
      throw new Error(`permanentRedirect:${target}`);
    },
  };
});

import GovernanceDashboardPage from "./page";

describe("GovernanceDashboardPage", () => {
  it("permanently redirects legacy bookmarks to workspace health", async () => {
    permanentRedirect.mockClear();

    await expect(
      GovernanceDashboardPage({
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("permanentRedirect:/insights/workspace-health");
  });

  it("preserves query params on the legacy redirect", async () => {
    permanentRedirect.mockClear();

    await expect(
      GovernanceDashboardPage({
        searchParams: Promise.resolve({ utm_source: "email", status: "Open" }),
      }),
    ).rejects.toThrow("permanentRedirect:/insights/workspace-health?utm_source=email&status=Open");
  });
});
