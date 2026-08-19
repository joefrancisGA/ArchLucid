namespace ArchLucid.Api.Services.Admin;

/// <summary>Tenant-scoped SCIM token summary for auth configuration diagnostics (no secrets).</summary>
public sealed record AuthConfigurationScimDiagnostics(
    bool? ScimProvisioningConfigured,
    bool? ScimBearerTokenActive);
