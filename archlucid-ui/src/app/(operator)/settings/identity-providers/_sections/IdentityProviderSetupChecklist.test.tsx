import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IdentityProviderSetupChecklist } from "./IdentityProviderSetupChecklist";

describe("IdentityProviderSetupChecklist", () => {
  it("shows ApiKey discovery guidance and config key", () => {
    render(
      <IdentityProviderSetupChecklist
        configDiagnostics={{
          authMode: "ApiKey",
          audienceConfigured: true,
          issuerOrAuthorityConfigured: null,
          openIdDiscoverySucceeded: null,
          saml2Enabled: false,
          spEntityIdConfigured: null,
          samlRoleClaimSourcesConfigured: null,
          tenantClaimMappingConfigured: null,
          tenantIdentityProviderProtocol: null,
          jwksConfigured: null,
          scimProvisioningConfigured: null,
          scimBearerTokenActive: null,
          roleClaimNameConfigured: true,
          misconfigurationHints: [],
        }}
        configDiagnosticsNote={null}
        samlOperationalHealth={{ saml2Enabled: false }}
      />,
    );

    expect(screen.getByText(/API key mode does not use OIDC discovery/i)).toBeInTheDocument();
    expect(screen.getAllByText("ArchLucidAuth:Mode").length).toBeGreaterThan(0);
  });

  it("shows development bypass as action needed with production-like auth doc link", () => {
    render(
      <IdentityProviderSetupChecklist
        configDiagnostics={{
          authMode: "DevelopmentBypass",
          audienceConfigured: false,
          issuerOrAuthorityConfigured: false,
          openIdDiscoverySucceeded: null,
          saml2Enabled: false,
          spEntityIdConfigured: null,
          samlRoleClaimSourcesConfigured: null,
          tenantClaimMappingConfigured: null,
          tenantIdentityProviderProtocol: null,
          jwksConfigured: null,
          scimProvisioningConfigured: null,
          scimBearerTokenActive: null,
          roleClaimNameConfigured: false,
          misconfigurationHints: [],
        }}
        configDiagnosticsNote={null}
        samlOperationalHealth={{ saml2Enabled: false }}
      />,
    );

    expect(screen.getByText(/Next setup step:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/DevelopmentBypass is local-only/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Setup guide" }).length).toBeGreaterThan(0);
  });

  it("shows SAML certificate unknown when enabled without expiry", () => {
    render(
      <IdentityProviderSetupChecklist
        configDiagnostics={{
          authMode: "JwtBearer",
          audienceConfigured: true,
          issuerOrAuthorityConfigured: true,
          openIdDiscoverySucceeded: true,
          saml2Enabled: true,
          spEntityIdConfigured: true,
          samlRoleClaimSourcesConfigured: true,
          tenantClaimMappingConfigured: true,
          tenantIdentityProviderProtocol: "saml",
          jwksConfigured: true,
          scimProvisioningConfigured: null,
          scimBearerTokenActive: null,
          roleClaimNameConfigured: true,
          misconfigurationHints: [],
        }}
        configDiagnosticsNote={null}
        samlOperationalHealth={{ saml2Enabled: true }}
      />,
    );

    expect(screen.getAllByText(/certificate expiry was not returned/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Authentication:Saml2:SigningCertificate").length).toBeGreaterThan(0);
  });
});
