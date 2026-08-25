import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/lib/admin-role-assignment-request", () => ({
  requestPrincipalAppRoleAssignment: vi.fn(),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Admin User",
      roleClaimValues: ["Admin"],
      primaryAppRole: "Admin" as const,
      maxAuthority: "AdminAuthority" as const,
      authorityRank: 3,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: 3,
    isAuthorityLoading: false,
  }),
}));

import { requestPrincipalAppRoleAssignment } from "@/lib/admin-role-assignment-request";

import { SETTINGS_ROLES_KEYS_TABLE_KEY_HINT_HEADER } from "./settings-roles-page-keys-tab-copy";
import { SettingsRolesPrincipalTable } from "./SettingsRolesPrincipalTable";

describe("SettingsRolesPrincipalTable (SSU P0)", () => {
  it("disables role changes for the signed-in administrator", () => {
    render(
      <SettingsRolesPrincipalTable
        rows={[
          {
            id: "self",
            kind: "user",
            name: "Admin User",
            detail: "admin@example.com",
            role: "Admin",
          },
        ]}
        onRoleChange={vi.fn(async () => "saved")}
      />,
    );

    expect(screen.getByTestId("settings-roles-self-role-helper-self")).toBeInTheDocument();
    expect(screen.getByTestId("settings-roles-select-user-self")).toBeDisabled();
    expect(document.querySelector('[data-principal-id="self"]')).toBeInTheDocument();
  });

  it("requires confirmation before assigning Admin and cancels without saving", async () => {
    const onRoleChange = vi.fn(async () => "saved");

    render(
      <SettingsRolesPrincipalTable
        rows={[
          {
            id: "u2",
            kind: "user",
            name: "Taylor",
            detail: "taylor@example.com",
            role: "Reader",
          },
        ]}
        onRoleChange={onRoleChange}
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Role for Taylor" }));
    fireEvent.click(screen.getByRole("option", { name: "Admin" }));

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(onRoleChange).not.toHaveBeenCalled();
  });

  it("shows inline not-saved state when the server rejects a role change", async () => {
    vi.mocked(requestPrincipalAppRoleAssignment).mockResolvedValue("rejected");

    render(
      <SettingsRolesPrincipalTable
        rows={[
          {
            id: "u3",
            kind: "user",
            name: "Sam",
            detail: "sam@example.com",
            role: "Reader",
          },
        ]}
        onRoleChange={async (row, nextRole) => {
          const outcome = await requestPrincipalAppRoleAssignment({ kind: row.kind, id: row.id }, nextRole);

          return outcome === "saved" ? "saved" : "rejected";
        }}
      />,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Role for Sam" }));
    fireEvent.click(screen.getByRole("option", { name: "Auditor" }));

    await waitFor(() => {
      expect(screen.getByTestId("settings-roles-save-status-user:u3")).toHaveTextContent("Not saved");
    });
  });

  it("uses automation-key column headers on the keys tab table (TB-1934)", () => {
    render(
      <SettingsRolesPrincipalTable
        tableContext="api_keys"
        rows={[
          {
            id: "key-1",
            kind: "api_key",
            name: "ci-deploy",
            detail: "al_…4f2a",
            role: "Operator",
          },
        ]}
        onRoleChange={vi.fn(async () => "saved")}
      />,
    );

    expect(screen.getByTestId("settings-roles-principal-identity-column-header")).toHaveTextContent(
      SETTINGS_ROLES_KEYS_TABLE_KEY_HINT_HEADER,
    );
    expect(screen.queryByText("Email / hint")).not.toBeInTheDocument();
  });
});
