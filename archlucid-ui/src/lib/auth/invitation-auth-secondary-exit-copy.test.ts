import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_HELP_PATH,
  AUTH_INVITE_PUBLIC_EXIT_LABEL,
  AUTH_INVITE_PUBLIC_EXIT_PATH,
  AUTH_INVITE_SIGN_IN_AGAIN_PATH,
  AUTH_INVITE_USE_DIFFERENT_ACCOUNT_LABEL,
} from "@/lib/auth/invitation-auth-secondary-exit-copy";

describe("invitation-auth-secondary-exit-copy (TB-1476)", () => {
  it("routes sign-in again to the auth sign-in route, not operator root", () => {
    expect(AUTH_INVITE_SIGN_IN_AGAIN_PATH).toBe("/auth/signin");
    expect(AUTH_INVITE_SIGN_IN_AGAIN_PATH).not.toBe("/");
  });

  it("reuses the public-safe secondary exit from session-expired (TB-1315 parity)", () => {
    expect(AUTH_INVITE_PUBLIC_EXIT_PATH).toBe("/welcome");
    expect(AUTH_INVITE_PUBLIC_EXIT_PATH).not.toBe("/");
    expect(AUTH_INVITE_PUBLIC_EXIT_LABEL).toBe("Back to ArchLucid");
  });

  it("routes help to the in-app help hub", () => {
    expect(AUTH_INVITE_HELP_PATH).toBe("/help");
  });

  it("labels account-switch actions for stuck invite users", () => {
    expect(AUTH_INVITE_USE_DIFFERENT_ACCOUNT_LABEL.toLowerCase()).toContain("different account");
  });
});
