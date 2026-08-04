import { describe, expect, it, vi } from "vitest";

import { resolveEmailOtpPostAuthPath } from "@/lib/auth/email-otp-post-auth";

vi.mock("@/lib/oidc/session", () => ({
  consumePostSignInReturnUrl: vi.fn(() => "/saved-return"),
}));

describe("resolveEmailOtpPostAuthPath", () => {
  it("returns safe return path for Complete", () => {
    expect(resolveEmailOtpPostAuthPath("Complete", "/architecture/reviews/1")).toBe("/architecture/reviews/1");
  });

  it("rejects open redirects for Complete", () => {
    expect(resolveEmailOtpPostAuthPath("Complete", "https://evil.example")).toBe("/saved-return");
  });

  it("routes AcceptInvitation to bootstrap", () => {
    expect(resolveEmailOtpPostAuthPath("AcceptInvitation", "/")).toBe("/auth/bootstrap");
  });

  it("routes CreateWorkspace to bootstrap", () => {
    expect(resolveEmailOtpPostAuthPath("CreateWorkspace", "/")).toBe("/auth/bootstrap");
  });

  it("routes CreateWorkspace with returnUrl", () => {
    expect(resolveEmailOtpPostAuthPath("CreateWorkspace", "/architecture/reviews/1")).toBe(
      "/auth/bootstrap?returnUrl=%2Farchitecture%2Freviews%2F1",
    );
  });

  it("routes SelectWorkspace to bootstrap", () => {
    expect(resolveEmailOtpPostAuthPath("SelectWorkspace", "/")).toBe("/auth/bootstrap");
  });
});
