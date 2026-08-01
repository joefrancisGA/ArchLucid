import { describe, expect, it, vi } from "vitest";

import { buildGraphRedirectPath } from "@/lib/legacy-architecture-graph-redirect";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    redirect(target);
    throw new Error(`redirect:${target}`);
  },
}));

import ArchitectureGraphOperateRedirectPage from "./page";

describe("ArchitectureGraphOperateRedirectPage (TB-1808 / TB-1810)", () => {
  it("redirects bare bookmarks to /graph", async () => {
    redirect.mockClear();

    await expect(
      ArchitectureGraphOperateRedirectPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("redirect:/graph");

    expect(redirect).toHaveBeenCalledWith("/graph");
  });

  it("preserves scalar and repeated query params on redirect", async () => {
    redirect.mockClear();
    const params = { runId: "run-42", scope: ["read", "write"] };

    await expect(
      ArchitectureGraphOperateRedirectPage({ searchParams: Promise.resolve(params) }),
    ).rejects.toThrow(`redirect:${buildGraphRedirectPath(params)}`);

    const target = redirect.mock.calls[0]?.[0] as string;
    expect(target).toContain("/graph?");
    expect(target).toContain("runId=run-42");
    expect(target).toContain("scope=read");
    expect(target).toContain("scope=write");
  });
});
