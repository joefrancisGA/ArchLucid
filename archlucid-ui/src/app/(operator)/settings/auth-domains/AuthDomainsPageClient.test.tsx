import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthDomainsPageClient } from "./AuthDomainsPageClient";
import {
  enableTenantAuthDomainEnforcement,
  fetchTenantAuthDomainEnforcementReadiness,
  fetchTenantAuthDomains,
  proposeTenantAuthDomain,
} from "@/lib/admin-auth-domains-api";

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

const readyReadiness = {
  canEnableEnforcement: true,
  hasRecoveryRoute: true,
  blockEnforcement: false,
  checklist: [],
};

describe("AuthDomainsPageClient", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
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
