import { describe, expect, it, vi } from "vitest";

import { buildLoginRedirectPath } from "@/lib/legacy-login-redirect";
import { buildSessionExpiredHref } from "@/lib/navigation/auth-sign-in-href";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    redirect(target);
    throw new Error(`redirect:${target}`);
  },
}));

import LoginPage from "./page";

describe("LoginPage (TB-1791)", () => {
  it("redirects default bookmarks to /auth/signin with query preserved", async () => {
    redirect.mockClear();
    const params = { returnUrl: "/reviews", reason: "unauthorized" };

    await expect(LoginPage({ searchParams: Promise.resolve(params) })).rejects.toThrow(
      `redirect:${buildLoginRedirectPath(params)}`,
    );

    expect(redirect).toHaveBeenCalledWith("/auth/signin?returnUrl=%2Freviews&reason=unauthorized");
  });

  it("redirects idle-timeout bookmarks to session-expired", async () => {
    redirect.mockClear();

    await expect(
      LoginPage({
        searchParams: Promise.resolve({ reason: "idle-timeout", returnUrl: "/reviews" }),
      }),
    ).rejects.toThrow(`redirect:${buildSessionExpiredHref("/reviews")}`);

    expect(redirect).toHaveBeenCalledWith(
      "/auth/session-expired?reason=idle-timeout&returnUrl=%2Freviews",
    );
  });
});
