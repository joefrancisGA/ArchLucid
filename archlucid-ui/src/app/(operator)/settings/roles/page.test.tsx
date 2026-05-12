import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const nav = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Admin User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: nav.callerAuthorityRank,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: nav.callerAuthorityRank,
    isAuthorityLoading: nav.isAuthorityLoading,
  }),
}));

import SettingsRolesPage from "./page";

describe("SettingsRolesPage", () => {
  it("blocks non-admin operators", () => {
    nav.callerAuthorityRank = 2;
    render(<SettingsRolesPage />);
    expect(screen.getByTestId("settings-roles-forbidden")).toBeInTheDocument();
    nav.callerAuthorityRank = 3;
  });

  it("renders principals for admins", async () => {
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/v1/admin/users") && (init === undefined || init.method === undefined)) {
        return new Response(
          JSON.stringify({
            users: [{ userId: "u1", displayName: "Ada", email: "ada@example.com", role: "Reader" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/v1/admin/api-keys") && (init === undefined || init.method === undefined)) {
        return new Response("missing", { status: 404 });
      }

      return new Response("unexpected", { status: 500 });
    });

    vi.stubGlobal("fetch", fetchMock);
    render(<SettingsRolesPage />);

    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-select-user-u1")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
