import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthDomainsActionConfirmDialog } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import {
  AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE,
  AUTH_DOMAINS_ENFORCEMENT_WARNING,
  AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE,
  AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE,
  AUTH_DOMAINS_SET_ENFORCEMENT_DOWNGRADE_CONFIRM_TITLE,
} from "@/lib/auth-domains-confirm-copy";

describe("AuthDomainsActionConfirmDialog", () => {
  it("delegates enable-enforcement copy to ConfirmationDialog (TB-2364)", () => {
    const onConfirm = vi.fn();

    render(
      <AuthDomainsActionConfirmDialog
        pending={{ kind: "enable-enforcement" }}
        currentWorkspaceLabel="Claims Intake Demo"
        busy={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("heading", { name: AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(AUTH_DOMAINS_ENFORCEMENT_WARNING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.getByText(/Claims Intake Demo/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enable enforcement" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders set-enforcement-mode confirm labels from enforcement mode", () => {
    render(
      <AuthDomainsActionConfirmDialog
        pending={{
          kind: "set-enforcement-mode",
          displayDomain: "example.com",
          enforcementMode: "SsoRequiredForVerifiedDomain",
          allowEmailOtpRecovery: false,
        }}
        currentWorkspaceLabel="Claims Intake Demo"
        busy={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set SSO required" })).toBeInTheDocument();
  });

  it("renders downgrade confirm labels for SSO optional", () => {
    render(
      <AuthDomainsActionConfirmDialog
        pending={{
          kind: "set-enforcement-mode",
          displayDomain: "example.com",
          enforcementMode: "SsoOptional",
          allowEmailOtpRecovery: false,
        }}
        currentWorkspaceLabel="Claims Intake Demo"
        busy={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: AUTH_DOMAINS_SET_ENFORCEMENT_DOWNGRADE_CONFIRM_TITLE })).toBeInTheDocument();
    expect(screen.getByText(/sign in without SSO/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Allow SSO optional" })).toBeInTheDocument();
  });

  it("renders recovery-admin removal warning in the description", () => {
    const warningMessage = "Removing the last recovery administrator may lock out break-glass access.";

    render(
      <AuthDomainsActionConfirmDialog
        pending={{
          kind: "recovery-remove",
          normalizedRecoveryAdminEmail: "breakglass@example.com",
          displayRecoveryAdminEmail: "breakglass@example.com",
          warningMessage,
        }}
        currentWorkspaceLabel="Claims Intake Demo"
        busy={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE })).toBeInTheDocument();
    expect(screen.getByText(warningMessage)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove breakglass@example.com" })).toBeInTheDocument();
  });
});
