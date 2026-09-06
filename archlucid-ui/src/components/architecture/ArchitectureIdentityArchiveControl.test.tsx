import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const patchArchitectureIdentityMock = vi.fn();
const useOperatorNavAuthorityMock = vi.fn();

vi.mock("@/lib/api/architecture-identity-api", () => ({
  patchArchitectureIdentity: (...args: unknown[]) => patchArchitectureIdentityMock(...args),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => useOperatorNavAuthorityMock(),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => "scope-key",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { ArchitectureIdentityArchiveControl } from "@/components/architecture/ArchitectureIdentityArchiveControl";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

describe("ArchitectureIdentityArchiveControl (CA-49)", () => {
  it("renders archive action for active identities when caller can execute", () => {
    useOperatorNavAuthorityMock.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
      isAuthorityLoading: false,
    });

    render(
      <ArchitectureIdentityArchiveControl
        architectureId="architecture-identity-001"
        displayName="Payments platform"
      />,
    );

    expect(screen.getByTestId("architecture-identity-archive")).toHaveTextContent("Archive architecture");
  });

  it("renders restore action when identity is archived", () => {
    useOperatorNavAuthorityMock.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
      isAuthorityLoading: false,
    });

    render(
      <ArchitectureIdentityArchiveControl
        architectureId="architecture-identity-001"
        displayName="Payments platform"
        archivedUtc="2026-01-02T00:00:00Z"
      />,
    );

    expect(screen.getByTestId("architecture-identity-restore")).toHaveTextContent("Restore architecture");
  });

  it("hides actions without ExecuteAuthority", () => {
    useOperatorNavAuthorityMock.mockReturnValue({
      callerAuthorityRank: AUTHORITY_RANK.ReadAuthority,
      isAuthorityLoading: false,
    });

    render(
      <ArchitectureIdentityArchiveControl
        architectureId="architecture-identity-001"
        displayName="Payments platform"
      />,
    );

    expect(screen.queryByTestId("architecture-identity-archive")).not.toBeInTheDocument();
  });
});
