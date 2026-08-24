import { describe, expect, it } from "vitest";

import {
  POST_AUTH_BOOTSTRAP_SIGN_IN_PATH,
  POST_AUTH_BOOTSTRAP_SIGN_IN_AGAIN_LABEL,
  POST_AUTH_BOOTSTRAP_USE_DIFFERENT_ACCOUNT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_LABEL,
  SESSION_EXPIRED_SECONDARY_EXIT_PATH,
} from "@/lib/auth/post-auth-bootstrap-exit-copy";

describe("post-auth-bootstrap-exit-copy (TB-1469)", () => {
  it("routes sign-in again to the auth sign-in route, not operator root", () => {
    expect(POST_AUTH_BOOTSTRAP_SIGN_IN_PATH).toBe("/auth/signin");
    expect(POST_AUTH_BOOTSTRAP_SIGN_IN_PATH).not.toBe("/");
  });

  it("reuses the app-home secondary exit from session-expired (TB-1315 parity)", () => {
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH).toBe("/");
    expect(SESSION_EXPIRED_SECONDARY_EXIT_PATH).not.toBe("/welcome");
    expect(SESSION_EXPIRED_SECONDARY_EXIT_LABEL).toBe("Back to ArchLucid");
  });

  it("labels account-switch actions for stuck bootstrap users", () => {
    expect(POST_AUTH_BOOTSTRAP_SIGN_IN_AGAIN_LABEL.toLowerCase()).toContain("sign in");
    expect(POST_AUTH_BOOTSTRAP_USE_DIFFERENT_ACCOUNT_LABEL.toLowerCase()).toContain("different account");
  });
});
