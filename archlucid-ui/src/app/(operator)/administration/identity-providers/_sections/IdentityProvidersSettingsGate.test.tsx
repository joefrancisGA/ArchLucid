import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING } from "@/lib/identity-providers-settings-copy";

vi.mock("./IdentityProvidersSettingsProvider", () => ({
  useIdentityProvidersSettingsModel: () => ({ accessDenied: false }),
}));

const useOperatorNavAuthorityMock = vi.fn();

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => useOperatorNavAuthorityMock(),
}));

import { IdentityProvidersSettingsGate } from "./IdentityProvidersSettingsGate";

describe("IdentityProvidersSettingsGate", () => {
  it("shows loading state while JWT authority is still resolving", () => {
    useOperatorNavAuthorityMock.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
      isAuthorityLoading: true,
    });

    render(
      <IdentityProvidersSettingsGate>{() => <div data-testid="child-shell" />}</IdentityProvidersSettingsGate>,
    );

    expect(screen.getByTestId("identity-providers-settings-loading")).toHaveTextContent(
      IDENTITY_PROVIDERS_DIAGNOSTICS_LOADING,
    );
    expect(screen.queryByTestId("identity-providers-settings-restricted")).not.toBeInTheDocument();
    expect(screen.queryByTestId("child-shell")).not.toBeInTheDocument();
  });
});
