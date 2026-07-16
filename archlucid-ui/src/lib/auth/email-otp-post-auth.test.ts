import { describe, expect, it, vi } from "vitest";

import { resolveEmailOtpPostAuthPath } from "@/lib/auth/email-otp-post-auth";

vi.mock("@/lib/oidc/session", () => ({
  consumePostSignInReturnUrl: vi.fn(() => "/saved-return"),
}));

describe("resolveEmailOtpPostAuthPath", () => {
  it("returns safe return path for Complete", () => {
    expect(resolveEmailOtpPostAuthPath("Complete", "/reviews/1")).toBe("/reviews/1");
  });

  it("rejects open redirects for Complete", () => {
    expect(resolveEmailOtpPostAuthPath("Complete", "https://evil.example")).toBe("/saved-return");
  });

  it("routes AcceptInvitation to signup", () => {
    expect(resolveEmailOtpPostAuthPath("AcceptInvitation", "/")).toBe("/signup");
  });

  it("routes CreateWorkspace to signup", () => {
    expect(resolveEmailOtpPostAuthPath("CreateWorkspace", "/")).toBe("/signup");
  });

  it("routes SelectWorkspace to home", () => {
    expect(resolveEmailOtpPostAuthPath("SelectWorkspace", "/")).toBe("/");
  });
});
