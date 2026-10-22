import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const replace = vi.fn();

const { signedInState } = vi.hoisted(() => ({
  signedInState: { value: false },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "entra-jwt",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => signedInState.value,
}));

const principalState: { current: CurrentPrincipal; loading: boolean } = {
  current: {
    provenance: "synthetic",
    syntheticReason: "jwt-unsigned",
    name: null,
    roleClaimValues: [],
    primaryAppRole: null,
    maxAuthority: "ReadAuthority",
    authorityRank: AUTHORITY_RANK.ReadAuthority,
    hasEnterpriseOperatorSurfaces: false,
    hasCommittedArchitectureReview: false,
    hasRecognizedArchLucidRole: false,
    permissionClaimValues: [],
  },
  loading: false,
};

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: principalState.current,
    callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
    isAuthorityLoading: principalState.loading,
  }),
}));

import { OperatorShellDeferredChrome } from "@/components/operator/OperatorShellDeferredChrome";

describe("OperatorShellDeferredChrome", () => {
  it("redirects unsigned JWT sessions to sign-in while deferred chrome is visible", () => {
    signedInState.value = false;
    principalState.loading = false;
    replace.mockClear();

    render(<OperatorShellDeferredChrome shellRootRef={{ current: null }} />);

    expect(replace).toHaveBeenCalledWith("/auth/signin?returnUrl=%2Farchitecture%2Freviews%2Frun-1");
  });
});
