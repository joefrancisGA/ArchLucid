import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
import { AUTH_DOMAINS_ENABLE_ENFORCEMENT_CONFIRM_TITLE, AUTH_DOMAINS_RECOVERY_REMOVE_CONFIRM_TITLE, AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE } from "@/lib/auth-domains-confirm-copy";

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

const sampleDomain = {
  tenantId: "tenant-1",
  displayDomain: "example.com",
  normalizedDomain: "example.com",
  verificationStatus: "Verified",
  enforcementMode: "SsoOptional",
  requireEnterpriseSso: false,
  allowEmailOtpRecovery: true,
  createdUtc: "2026-07-01T00:00:00.000Z",
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
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
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

  it("applies SSO optional immediately with specific success copy", async () => {
    vi.mocked(fetchTenantAuthDomains).mockResolvedValue([sampleDomain]);
    vi.mocked(fetchTenantAuthDomainEnforcementReadiness).mockResolvedValue(readyReadiness);
    vi.mocked(setTenantAuthDomainEnforcement).mockResolvedValue({} as never);

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-domain-row-example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("auth-domain-row-example.com"));
    fireEvent.click(screen.getByTestId("auth-domains-enforcement-optional"));

    await waitFor(() => {
      expect(setTenantAuthDomainEnforcement).toHaveBeenCalledWith("example.com", "SsoOptional", false);
    });
    expect(screen.queryByRole("heading", { name: AUTH_DOMAINS_SET_ENFORCEMENT_CONFIRM_TITLE })).not.toBeInTheDocument();
    expect(screen.getByText(/Enforcement mode for example.com set to SSO optional/i)).toBeInTheDocument();
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
