import { describe, expect, it, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect,
}));

describe("ExecutiveScorecardPage", () => {
  it("redirects legacy bookmarks to the executive dashboard", async () => {
    const module = await import("./page");
    module.default();

    expect(redirect).toHaveBeenCalledWith("/architecture/executive-dashboard");
  });
});
