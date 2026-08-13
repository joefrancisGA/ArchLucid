import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const replace = vi.fn();

const { signedInState } = vi.hoisted(() => ({
  signedInState: { value: true },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews",
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
    provenance: "auth-me",
    name: "ops@example.com",
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

import { OperatorRoleGate } from "@/components/operator/OperatorRoleGate";

describe("OperatorRoleGate", () => {
  it("redirects signed-in principals without ArchLucid roles to /403", () => {
    signedInState.value = true;
    principalState.loading = false;

    render(
      <OperatorRoleGate>
        <div>protected</div>
      </OperatorRoleGate>,
    );

    expect(replace).toHaveBeenCalledWith("/403");
  });

  it("redirects unsigned JWT sessions to sign-in with returnUrl and hides page content", () => {
    signedInState.value = false;
    principalState.loading = false;
    replace.mockClear();

    const view = render(
      <OperatorRoleGate>
        <div data-testid="protected-page">protected</div>
      </OperatorRoleGate>,
    );

    expect(view.getByTestId("operator-shell-access-gate-loading")).toBeInTheDocument();
    expect(view.queryByTestId("protected-page")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/auth/signin?returnUrl=%2Farchitecture%2Freviews");
  });

  it("preserves query string in sign-in returnUrl for unsigned JWT sessions", () => {
    signedInState.value = false;
    principalState.loading = false;
    replace.mockClear();

    const locationSpy = vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      search: "?x=1",
    });

    try {
      render(
        <OperatorRoleGate>
          <div data-testid="protected-page">protected</div>
        </OperatorRoleGate>,
      );

      expect(replace).toHaveBeenCalledWith("/auth/signin?returnUrl=%2Farchitecture%2Freviews%3Fx%3D1");
    } finally {
      locationSpy.mockRestore();
    }
  });

  it("renders neutral loading without page content while authority resolves", () => {
    signedInState.value = true;
    principalState.loading = true;
    replace.mockClear();

    const view = render(
      <OperatorRoleGate>
        <div data-testid="protected-page">protected</div>
      </OperatorRoleGate>,
    );

    expect(view.getByTestId("operator-shell-access-gate-loading")).toBeInTheDocument();
    expect(view.queryByTestId("protected-page")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
