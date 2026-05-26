import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
}));

import { operatorNavOutsideProviderPrincipal } from "@/lib/current-principal";
import {
  publishOperatorShellPrincipalSnapshot,
  shouldShowJwtBearerMissingRoleBanner,
} from "@/lib/operator-shell-principal-snapshot";

describe("operator-shell-principal-snapshot", () => {
  it("returns true when auth-me principal lacks recognized ArchLucid role", () => {
    publishOperatorShellPrincipalSnapshot({
      ...operatorNavOutsideProviderPrincipal,
      provenance: "auth-me",
      hasRecognizedArchLucidRole: false,
    });

    expect(shouldShowJwtBearerMissingRoleBanner()).toBe(true);
  });

  it("returns false when principal has a recognized role", () => {
    publishOperatorShellPrincipalSnapshot({
      ...operatorNavOutsideProviderPrincipal,
      provenance: "auth-me",
      hasRecognizedArchLucidRole: true,
    });

    expect(shouldShowJwtBearerMissingRoleBanner()).toBe(false);
  });
});
