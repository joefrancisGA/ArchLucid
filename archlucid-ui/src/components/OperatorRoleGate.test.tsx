import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CurrentPrincipal } from "@/lib/current-principal";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/reviews",
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => true,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => true,
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

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: principalState.current,
    callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
    isAuthorityLoading: principalState.loading,
  }),
}));

import { OperatorRoleGate } from "@/components/OperatorRoleGate";

describe("OperatorRoleGate", () => {
  it("redirects signed-in principals without ArchLucid roles to /403", () => {
    principalState.loading = false;

    render(
      <OperatorRoleGate>
        <div>protected</div>
      </OperatorRoleGate>,
    );

    expect(replace).toHaveBeenCalledWith("/403");
  });

  it("renders neutral loading without page content while authority resolves", () => {
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
