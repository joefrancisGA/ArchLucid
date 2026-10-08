import { describe, expect, it, vi } from "vitest";

import {
  resolveBootstrapCompletePath,
  resolveEmailOtpPostAuthPath,
} from "@/lib/auth/email-otp-post-auth";
import { consumePostSignInReturnUrl } from "@/lib/oidc/session";

vi.mock("@/lib/oidc/session", () => ({
  consumePostSignInReturnUrl: vi.fn(() => "/saved-return"),
}));

describe("resolveEmailOtpPostAuthPath", () => {
  it("returns safe return path for Complete", () => {
    expect(resolveEmailOtpPostAuthPath("Complete", "/architecture/reviews/1")).toBe("/architecture/reviews/1");
  });

  it("prefers explicit safe returnUrl over consumed OIDC return for Complete", () => {
    vi.mocked(consumePostSignInReturnUrl).mockReturnValueOnce("/saved-return");

    expect(resolveEmailOtpPostAuthPath("Complete", "/architecture/reviews/1")).toBe("/architecture/reviews/1");
    expect(consumePostSignInReturnUrl).toHaveBeenCalledTimes(1);
  });

  it("prefers explicit default return path over idle-persisted sign-in URL in OIDC return storage", () => {
    vi.mocked(consumePostSignInReturnUrl).mockReturnValueOnce("/auth/signin?step=code");

    expect(resolveEmailOtpPostAuthPath("Complete", "/")).toBe("/");
  });

  it("rejects open redirects for Complete", () => {
    expect(resolveEmailOtpPostAuthPath("Complete", "https://evil.example")).toBe("/saved-return");
  });

  it("falls back to consumed safe desk path when explicit returnUrl is unsafe", () => {
    vi.mocked(consumePostSignInReturnUrl).mockReturnValueOnce("/architecture/reviews/1");

    expect(resolveEmailOtpPostAuthPath("Complete", "https://evil.example")).toBe("/architecture/reviews/1");
  });

  it("rejects an unsafe consumed return URL", () => {
    vi.mocked(consumePostSignInReturnUrl).mockReturnValueOnce("https://evil.example");

    expect(resolveEmailOtpPostAuthPath("Complete", "https://evil.example")).toBe("/");
  });

  it("rejects an unsafe consumed return URL when completing bootstrap", () => {
    vi.mocked(consumePostSignInReturnUrl).mockReturnValueOnce("https://evil.example");

    expect(resolveBootstrapCompletePath("https://evil.example")).toBe("/");
  });

  it("prefers explicit safe returnUrl over consumed OIDC return for bootstrap complete", () => {
    vi.mocked(consumePostSignInReturnUrl).mockReturnValueOnce("/saved-return");

    expect(resolveBootstrapCompletePath("/architecture/reviews/1")).toBe("/architecture/reviews/1");
    expect(consumePostSignInReturnUrl).toHaveBeenCalledTimes(1);
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

  it("returns the safe return path for unknown nextStep values instead of bootstrap", () => {
    expect(resolveEmailOtpPostAuthPath("FutureBootstrapStep", "/architecture/reviews/1")).toBe(
      "/architecture/reviews/1",
    );
  });
});
