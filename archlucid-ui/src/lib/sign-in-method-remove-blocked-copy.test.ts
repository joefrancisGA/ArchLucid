import { describe, expect, it } from "vitest";

import type { SignInMethodSummary } from "@/lib/sign-in-methods-api";
import {
  SIGN_IN_METHOD_ENTERPRISE_SSO_BLOCKED_REASON,
  SIGN_IN_METHOD_GENERIC_BLOCKED_REASON,
  SIGN_IN_METHOD_INACTIVE_BLOCKED_REASON,
  SIGN_IN_METHOD_LAST_REMAINING_BLOCKED_REASON,
  resolveSignInMethodRemoveBlockedReason,
} from "@/lib/sign-in-method-remove-blocked-copy";

function method(overrides: Partial<SignInMethodSummary> & Pick<SignInMethodSummary, "identityId">): SignInMethodSummary {
  return {
    providerType: "EmailOneTimeCode",
    providerLabel: "Email code",
    maskedIdentifier: "y***@example.com",
    addedUtc: "2026-07-01T00:00:00.000Z",
    lastUsedUtc: null,
    isActive: true,
    canRemove: false,
    ...overrides,
  };
}

describe("sign-in-method-remove-blocked-copy (TB-1883)", () => {
  it("explains inactive methods", () => {
    const rows = [method({ identityId: "id-1", isActive: false })];

    expect(resolveSignInMethodRemoveBlockedReason(rows[0], rows)).toBe(
      SIGN_IN_METHOD_INACTIVE_BLOCKED_REASON,
    );
  });

  it("explains when only one active method remains", () => {
    const rows = [method({ identityId: "id-1", canRemove: false })];

    expect(resolveSignInMethodRemoveBlockedReason(rows[0], rows)).toBe(
      SIGN_IN_METHOD_LAST_REMAINING_BLOCKED_REASON,
    );
  });

  it("explains enterprise SSO policy when the last enterprise method would be removed", () => {
    const rows = [
      method({ identityId: "id-1", providerType: "MicrosoftIdentity", providerLabel: "Microsoft" }),
      method({ identityId: "id-2", providerType: "EmailOneTimeCode", canRemove: true }),
    ];

    expect(resolveSignInMethodRemoveBlockedReason(rows[0], rows)).toBe(
      SIGN_IN_METHOD_ENTERPRISE_SSO_BLOCKED_REASON,
    );
  });

  it("falls back when removal is blocked for an unknown reason", () => {
    const rows = [
      method({ identityId: "id-1", canRemove: false }),
      method({ identityId: "id-2", canRemove: true }),
    ];

    expect(resolveSignInMethodRemoveBlockedReason(rows[0], rows)).toBe(
      SIGN_IN_METHOD_GENERIC_BLOCKED_REASON,
    );
  });
});
