import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const proxyJsonGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: proxyJsonGetMock,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

const authorityState = { callerAuthorityRank: 0 };

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

vi.mock("@/lib/admin-auth-domains-api", () => ({
  fetchTenantAuthDomains: vi.fn(async () => []),
  fetchTenantAuthDomainEnforcementReadiness: vi.fn(async () => ({
    canEnableEnforcement: false,
    hasRecoveryRoute: false,
    blockEnforcement: true,
    checklist: [],
  })),
  fetchTenantAuthDomainRecoveryAdmins: vi.fn(async () => []),
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

vi.mock("@/lib/admin-identity-provider-api", () => ({
  fetchTenantIdentityProviderConfiguration: vi.fn(async () => null),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <button type="button">Page help</button>,
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

import { AuthDomainsPageClient } from "@/app/(operator)/administration/auth-domains/AuthDomainsPageClient";
import { SsoWizardPageClient } from "@/app/(operator)/administration/identity/sso-wizard/_sections/SsoWizardPageClient";
import { ScimProvisioningSettingsPageClient } from "@/app/(operator)/administration/scim-provisioning/_sections/ScimProvisioningSettingsPageClient";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

function mockInviteBlockers(): void {
  proxyJsonGetMock.mockResolvedValue({
    operatorBaseUrlConfigured: false,
    localTrialIdentityConfigured: false,
  });
}

function mockEmptyTokensFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/proxy/v1/admin/scim/tokens") && (!init?.method || init.method === "GET")) {
        return new Response(JSON.stringify({ tokens: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("not found", { status: 404 });
    }),
  );
}

describe("AuthBetaReadinessInviteCallout admin surfaces (TB-928 wave 2)", () => {
  beforeEach(() => {
    authorityState.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("SCIM provisioning mounts invite readiness callout when diagnostics report blockers", async () => {
    mockInviteBlockers();
    mockEmptyTokensFetch();
    vi.stubGlobal("location", { ...window.location, origin: "https://tenant.example.com" });

    render(<ScimProvisioningSettingsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-beta-readiness-invite-callout")).toBeInTheDocument();
    });
  });

  it("SSO wizard mounts invite readiness callout when diagnostics report blockers", async () => {
    mockInviteBlockers();

    render(<SsoWizardPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-beta-readiness-invite-callout")).toBeInTheDocument();
    });
  });

  it("Sign-in domains mounts invite readiness callout when diagnostics report blockers", async () => {
    mockInviteBlockers();

    render(<AuthDomainsPageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("auth-beta-readiness-invite-callout")).toBeInTheDocument();
    });
  });
});
