import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthDomainsPageClient } from "./AuthDomainsPageClient";
import {
  enableTenantAuthDomainEnforcement,
  fetchTenantAuthDomainEnforcementReadiness,
  fetchTenantAuthDomainRecoveryAdmins,
  fetchTenantAuthDomains,
  proposeTenantAuthDomain,
  removeTenantAuthDomainRecoveryAdmin,
  setTenantAuthDomainEnforcement,
} from "@/lib/admin-auth-domains-api";
import {
  AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE,
  AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE,
  AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE,
  AUTH_DOMAINS_SET_ENFORCEMENT_DOWNGRADE_CONFIRM_TITLE,
} from "@/lib/auth-domains-confirm-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  AUTH_DOMAINS_ADD_DOMAIN_READINESS,
  AUTH_DOMAINS_ADMIN_AUTHORITY_BLOCKED_LABEL,
  AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL,
  AUTH_DOMAINS_AUTHENTICATION_HELP_CTA,
  AUTH_DOMAINS_EMPTY_TITLE,
  AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
  AUTH_DOMAINS_PAGE_TITLE,
  AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_DETAIL,
  AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_LABEL,
  AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE,
  authDomainsJourneyStepAriaLabel,
} from "@/lib/auth-domains-page-copy";
import { AUTH_DOMAINS_ZERO_DOMAIN_ENFORCEMENT_CALLOUT } from "@/lib/auth-domains-confirm-copy";
import { AUTH_DOMAINS_SETTINGS_SOURCES } from "@/lib/auth-domains-settings-evidence-copy";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

vi.mock("@/lib/admin-auth-domains-api", () => ({
  fetchTenantAuthDomains: vi.fn(),
  fetchTenantAuthDomainRecoveryAdmins: vi.fn().mockResolvedValue([]),
  fetchTenantAuthDomainEnforcementReadiness: vi.fn(),
  proposeTenantAuthDomain: vi.fn(),
  startTenantAuthDomainVerification: vi.fn(),
  checkTenantAuthDomainVerification: vi.fn(),
  testTenantAuthDomainRouting: vi.fn(),
  markTenantAuthDomainRoutingTested: vi.fn(),
  setTenantAuthDomainEnforcement: vi.fn(),
  enableTenantAuthDomainEnforcement: vi.fn(),
  addTenantAuthDomainRecoveryAdmin: vi.fn(),
  removeTenantAuthDomainRecoveryAdmin: vi.fn(),
}));

// Hoisted so individual tests can lower the caller rank without re-mocking the provider module.
const authorityState = { callerAuthorityRank: AUTHORITY_RANK.AdminAuthority };

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();

  return {
    ...actual,
    useOperatorNavAuthority: () => ({
      ...actual.useOperatorNavAuthority(),
      callerAuthorityRank: authorityState.callerAuthorityRank,
    }),
  };
});

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Claims Intake Demo",
    projectLabel: "Default project",
  }),
}));

const sampleDomain = {
  tenantId: "tenant-1",
  displayDomain: "example.com",
  normalizedDomain: "example.com",
  verificationStatus: "Verified",
  enforcementMode: "SsoOptional",
  requireEnterpriseSso: false,
  allowEmailOtpRecovery: true,
  createdUtc: "2026-07-01T00:00:00.000Z",
  routingTestPassedUtc: "2026-07-02T00:00:00.000Z",
  isEnforcementActive: false,
};

const recoveryDomain = {
  ...sampleDomain,
  enforcementMode: "SsoRequiredWithRecoveryException",
};

const recoveryAdmin = {
  tenantId: "tenant-1",
  normalizedDomain: "example.com",
  displayRecoveryAdminEmail: "breakglass@example.com",
  normalizedRecoveryAdminEmail: "breakglass@example.com",
  authenticationVerifiedUtc: "2026-07-01T00:00:00.000Z",
};

const readyReadiness = {
  canEnableEnforcement: true,
  hasRecoveryRoute: true,
  blockEnforcement: false,
  checklist: [],
};

describe("AuthDomainsPageClient", () => {
  beforeEach(() => {
    authorityState.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("renders shared page chrome, tenant scope, and journey strip", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([]);

    render(<AuthDomainsPageClient />);

    expect(screen.queryByTestId("auth-domains-page-breadcrumb")).toBeNull();
    expect(screen.getByTestId("auth-domains-page-title")).toHaveTextContent(AUTH_DOMAINS_PAGE_TITLE);
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toHaveTextContent(PAGE_HELP_SHORT_TRIGGER_TEXT);
    expect(screen.getByTestId("auth-domains-tenant-scope")).toHaveTextContent("Claims Intake Demo");
    expect(screen.getByTestId("auth-domains-admin-authority-tag")).toHaveTextContent(
      AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL,
    );
    expect(await screen.findByTestId("auth-domains-sign-in-posture-tag")).toHaveTextContent(
      AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_LABEL,
    );
    expect(screen.getByTestId("auth-domains-sign-in-posture")).toHaveTextContent(AUTH_DOMAINS_ZERO_DOMAIN_POSTURE_DETAIL);
    expect(screen.getByTestId("auth-domains-zero-domain-enforcement-callout")).toHaveTextContent(
      AUTH_DOMAINS_ZERO_DOMAIN_ENFORCEMENT_CALLOUT,
    );
    expect(screen.getByTestId("auth-domains-add-prerequisites")).toHaveTextContent(
      AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE,
    );
    expect(screen.getByRole("button", { name: authDomainsJourneyStepAriaLabel(0, "Add domain") })).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-journey-step-add")).toHaveAttribute("aria-current", "step");
    expect(screen.getByTestId("auth-domains-add-readiness")).toHaveTextContent(AUTH_DOMAINS_ADD_DOMAIN_READINESS);
    expect(screen.getByTestId("auth-domains-empty-state")).toHaveTextContent(AUTH_DOMAINS_EMPTY_TITLE);
    expect(screen.queryByRole("button", { name: "Add your first domain" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add domain" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: AUTH_DOMAINS_AUTHENTICATION_HELP_CTA })).toHaveAttribute(
      "href",
      inAppHelpHref("authentication-sign-in"),
    );
    expect(screen.getByTestId("auth-domains-settings-claim-discipline")).toBeInTheDocument();

    for (const source of AUTH_DOMAINS_SETTINGS_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }
  });

  it("does not show sign-in posture until domains finish loading", async () => {
    let resolveDomains: ((domains: typeof sampleDomain[]) => void) | undefined;
    const domainsPromise = new Promise<typeof sampleDomain[]>((resolve) => {
      resolveDomains = resolve;
    });
    vi.mocked(fetchTenantAuthDomains).mockReturnValue(domainsPromise);

    render(<AuthDomainsPageClient />);

    expect(screen.queryByTestId("auth-domains-sign-in-posture")).not.toBeInTheDocument();
    expect(screen.queryByTestId("auth-domains-zero-domain-enforcement-callout")).not.toBeInTheDocument();

    resolveDomains?.([sampleDomain]);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domains-sign-in-posture")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("auth-domains-zero-domain-enforcement-callout")).not.toBeInTheDocument();
  });

  it("humanizes verification and enforcement enums in the domain list", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);

    render(<AuthDomainsPageClient />);

    const statusRow = await screen.findByTestId("auth-domain-status-example.com");

    expect(statusRow).toHaveTextContent("Verified");
    expect(statusRow).toHaveTextContent("SSO optional");
    expect(statusRow).not.toHaveTextContent("SsoOptional");
    expect(statusRow.querySelector("[data-verification-status='Verified']")).not.toBeNull();
    expect(statusRow.querySelector("[data-enforcement-mode='SsoOptional']")).not.toBeNull();
  });

  it("does not call window.confirm for enable enforcement", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);
    vi.mocked(enableTenantAuthDomainEnforcement).mockResolvedValue(undefined);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));
    fireEvent.click(screen.getByTestId("auth-domains-session-ack"));
    fireEvent.click(screen.getByTestId("auth-domains-enable-enforcement"));

    expect(
      await screen.findByRole("heading", { name: AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-tenant-scope")).toHaveTextContent("Claims Intake Demo");
    expect(confirmSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Enable enforcement" }));

    await waitFor(() => {
      expect(enableTenantAuthDomainEnforcement).toHaveBeenCalledWith("example.com", true);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("disables enable enforcement while enable is in flight", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);

    let resolveEnable: (() => void) | undefined;
    const enablePromise = new Promise<void>((resolve) => {
      resolveEnable = resolve;
    });
    vi.mocked(enableTenantAuthDomainEnforcement).mockReturnValue(enablePromise);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));
    fireEvent.click(screen.getByTestId("auth-domains-session-ack"));
    fireEvent.click(screen.getByTestId("auth-domains-enable-enforcement"));
    fireEvent.click(screen.getByRole("button", { name: "Enable enforcement" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-domains-enable-enforcement")).toBeDisabled();
    });

    expect(enableTenantAuthDomainEnforcement).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("auth-domains-enable-enforcement"));
    expect(enableTenantAuthDomainEnforcement).toHaveBeenCalledTimes(1);

    resolveEnable?.();
    await waitFor(() => {
      expect(enableTenantAuthDomainEnforcement).toHaveBeenCalledTimes(1);
    });
  });

  it("shows in-page confirm before forced recovery-admin removal", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const warningMessage = "Removing the last recovery administrator may lock out break-glass access.";

    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([recoveryDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);
    vi.mocked(fetchTenantAuthDomainRecoveryAdmins).mockResolvedValue([recoveryAdmin]);
    vi.mocked(removeTenantAuthDomainRecoveryAdmin)
      .mockResolvedValueOnce({
        removed: false,
        warningMessage,
      })
      .mockResolvedValueOnce({
        removed: true,
        warningMessage: null,
      });

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));

    const removeButton = await screen.findByTestId("auth-domains-remove-recovery-breakglass@example.com");
    fireEvent.click(removeButton);

    expect(
      await screen.findByRole("heading", { name: AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(warningMessage)).toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(removeTenantAuthDomainRecoveryAdmin).toHaveBeenCalledWith("example.com", "breakglass@example.com", false);

    fireEvent.click(screen.getByRole("button", { name: "Remove breakglass@example.com" }));

    await waitFor(() => {
      expect(removeTenantAuthDomainRecoveryAdmin).toHaveBeenCalledWith("example.com", "breakglass@example.com", true);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("requires confirmation before setting Require SSO enforcement mode", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);
    vi.mocked(setTenantAuthDomainEnforcement).mockResolvedValue({} as never);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));
    fireEvent.click(screen.getByTestId("auth-domains-enforcement-required"));

    expect(
      await screen.findByRole("heading", { name: AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(setTenantAuthDomainEnforcement).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Set SSO required" }));

    await waitFor(() => {
      expect(setTenantAuthDomainEnforcement).toHaveBeenCalledWith(
        "example.com",
        "SsoRequiredForVerifiedDomain",
        false,
      );
    });
    expect(screen.getByText(/Enforcement mode for example.com set to SSO required/i)).toBeInTheDocument();
  });

  it("requires confirmation before downgrading to SSO optional", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);
    vi.mocked(setTenantAuthDomainEnforcement).mockResolvedValue({} as never);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));
    fireEvent.click(screen.getByTestId("auth-domains-enforcement-optional"));

    expect(
      await screen.findByRole("heading", { name: AUTH_DOMAINS_SET_ENFORCEMENT_DOWNGRADE_CONFIRM_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(/sign in without SSO/i)).toBeInTheDocument();
    expect(setTenantAuthDomainEnforcement).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Allow SSO optional" }));

    await waitFor(() => {
      expect(setTenantAuthDomainEnforcement).toHaveBeenCalledWith("example.com", "SsoOptional", false);
    });
    expect(screen.getByText(/Enforcement mode for example.com set to SSO optional/i)).toBeInTheDocument();
  });

  it("renders mutation recovery contract instead of raw API errors", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);
    vi.mocked(setTenantAuthDomainEnforcement).mockRejectedValue(new Error("Internal server error detail"));

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));
    fireEvent.click(screen.getByTestId("auth-domains-enforcement-required"));
    fireEvent.click(screen.getByRole("button", { name: "Set SSO required" }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-domains-inline-error")).toHaveTextContent(AUTH_DOMAINS_MUTATION_ERROR_SUMMARY);
    });
    expect(screen.getByTestId("auth-domains-inline-error")).not.toHaveTextContent("Internal server error detail");
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-intact")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-next-step")).toBeInTheDocument();
  });

  it("disables mutating controls and names the missing authority below admin rank", async () => {
    authorityState.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    expect(screen.getByTestId("auth-domains-admin-authority-tag")).toHaveTextContent(
      AUTH_DOMAINS_ADMIN_AUTHORITY_BLOCKED_LABEL,
    );
    expect(screen.getByTestId("auth-domains-admin-authority-disabled-hint")).toHaveTextContent(
      AUTH_DOMAINS_ADMIN_AUTHORITY_READY_LABEL,
    );

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));

    expect(screen.getByTestId("auth-domains-start-verification")).toBeDisabled();
    expect(screen.getByTestId("auth-domains-preview-routing")).toBeDisabled();
    expect(screen.getByTestId("auth-domains-enforcement-required")).toBeDisabled();
    expect(screen.getByTestId("auth-domains-enable-enforcement")).toBeDisabled();

    fireEvent.click(screen.getByTestId("auth-domains-enforcement-required"));

    expect(setTenantAuthDomainEnforcement).not.toHaveBeenCalled();
    expect(screen.queryByTestId("auth-domains-inline-error")).not.toBeInTheDocument();
  });

  it("keeps mutating controls available at admin rank", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));

    expect(screen.queryByTestId("auth-domains-admin-authority-disabled-hint")).not.toBeInTheDocument();
    expect(screen.getByTestId("auth-domains-start-verification")).not.toBeDisabled();
    expect(screen.getByTestId("auth-domains-enforcement-required")).not.toBeDisabled();
  });

  it("disables add domain while propose is in flight", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([]);

    let resolvePropose: (() => void) | undefined;
    const proposePromise = new Promise<{ domain: typeof sampleDomain; dnsVerificationInstruction: string }>(
      (resolve) => {
        resolvePropose = () =>
          resolve({
            domain: sampleDomain,
            dnsVerificationInstruction: "Add TXT record",
          });
      },
    );
    vi.mocked(proposeTenantAuthDomain).mockReturnValue(proposePromise);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domains-new-domain")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("auth-domains-new-domain"), { target: { value: "example.com" } });
    fireEvent.click(screen.getByTestId("auth-domains-add"));

    await waitFor(() => {
      expect(screen.getByTestId("auth-domains-add")).toBeDisabled();
    });

    expect(proposeTenantAuthDomain).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("auth-domains-add"));
    expect(proposeTenantAuthDomain).toHaveBeenCalledTimes(1);

    resolvePropose?.();
    await waitFor(() => {
      expect(proposeTenantAuthDomain).toHaveBeenCalledTimes(1);
    });
  });
});
