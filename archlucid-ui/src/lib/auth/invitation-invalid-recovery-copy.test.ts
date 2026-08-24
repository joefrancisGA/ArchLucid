import { describe, expect, it } from "vitest";

import {
  AUTH_INVITE_PUBLIC_EXIT_LABEL,
  AUTH_INVITE_PUBLIC_EXIT_PATH,
  AUTH_INVITE_REQUEST_ACCESS_PATH,
  AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH,
  mapInvitationStatusToRecoveryContext,
  resolveInvalidInvitationMessage,
} from "@/lib/auth/invitation-invalid-recovery-copy";

describe("invitation-invalid-recovery-copy (TB-1474)", () => {
  it("routes sign-in without token to the auth sign-in route", () => {
    expect(AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH).toBe("/auth/signin");
    expect(AUTH_INVITE_SIGN_IN_WITHOUT_TOKEN_PATH).not.toBe("/");
  });

  it("reuses the app-home secondary exit from session-expired (TB-1315 parity)", () => {
    expect(AUTH_INVITE_PUBLIC_EXIT_PATH).toBe("/");
    expect(AUTH_INVITE_PUBLIC_EXIT_PATH).not.toBe("/welcome");
    expect(AUTH_INVITE_PUBLIC_EXIT_LABEL).toBe("Back to ArchLucid");
  });

  it("routes request access to signup", () => {
    expect(AUTH_INVITE_REQUEST_ACCESS_PATH).toBe("/signup");
  });

  it("maps non-valid invitation statuses to recovery contexts", () => {
    expect(mapInvitationStatusToRecoveryContext("Valid")).toBeNull();
    expect(mapInvitationStatusToRecoveryContext("Expired")).toBe("expired");
    expect(mapInvitationStatusToRecoveryContext("Revoked")).toBe("revoked");
    expect(mapInvitationStatusToRecoveryContext("Accepted")).toBe("accepted");
    expect(mapInvitationStatusToRecoveryContext("Invalid")).toBe("invalid");
  });

  it("keeps status-specific invalid messages", () => {
    expect(resolveInvalidInvitationMessage("expired")).toContain("expired");
    expect(resolveInvalidInvitationMessage("revoked")).toContain("no longer active");
    expect(resolveInvalidInvitationMessage("accepted")).toContain("already been used");
    expect(resolveInvalidInvitationMessage("missing-token")).toContain("not valid");
  });
});
