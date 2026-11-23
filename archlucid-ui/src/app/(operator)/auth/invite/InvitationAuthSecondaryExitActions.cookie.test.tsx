import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InvitationAuthSecondaryExitActions } from "@/app/(operator)/auth/invite/InvitationAuthSecondaryExitActions";
import {
  OIDC_ACCESS_TOKEN_KEY,
  OIDC_EXPIRES_AT_MS_KEY,
  OIDC_USER_SUBJECT_KEY,
} from "@/lib/oidc/storage-keys";

describe("InvitationAuthSecondaryExitActions session cookie", () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stays signed in on the invite page when the session-cookie DELETE returns 500", async () => {
    const assign = vi.fn();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign },
    });
    sessionStorage.setItem(OIDC_ACCESS_TOKEN_KEY, "access-token");
    sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-test");
    sessionStorage.setItem(OIDC_EXPIRES_AT_MS_KEY, String(Date.now() + 3_600_000));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "DELETE") {
          return new Response("cookie not cleared", { status: 500 });
        }

        return new Response(JSON.stringify({ url: null }), { status: 200 });
      }),
    );

    render(<InvitationAuthSecondaryExitActions />);

    await act(async () => {
      fireEvent.click(screen.getByTestId("invitation-secondary-sign-in-again"));
    });

    expect(sessionStorage.getItem(OIDC_ACCESS_TOKEN_KEY)).toBe("access-token");
    expect(assign).not.toHaveBeenCalled();
  });
});
