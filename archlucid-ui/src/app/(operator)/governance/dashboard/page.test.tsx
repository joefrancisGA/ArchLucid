import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("GovernanceDashboardPage", () => {
  it("redirects legacy bookmarks to executive dashboard workspace health", async () => {
    const module = await import("./page");
    module.default();

    expect(redirect).toHaveBeenCalledWith("/architecture/executive-dashboard#workspace-health");
  });
});
