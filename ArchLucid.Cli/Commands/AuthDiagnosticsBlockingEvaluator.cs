using ArchLucid.Contracts.Admin;

namespace ArchLucid.Cli.Commands;

/// <summary>
///     Mirrors API blocking rules for <see cref="AdminAuthConfigurationDiagnosticsResponse" /> so the CLI can exit
///     non-zero without referencing ArchLucid.Api.
/// </summary>
internal static class AuthDiagnosticsBlockingEvaluator
{
    internal static bool HasBlockingMisconfiguration(AdminAuthConfigurationDiagnosticsResponse response)
    {
        ArgumentNullException.ThrowIfNull(response);

        if (string.Equals(response.AuthMode, "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.Equals(response.AuthMode, "ApiKey", StringComparison.OrdinalIgnoreCase))
            return false;

        if (!response.AudienceConfigured)
            return true;

        if (!response.IssuerOrAuthorityConfigured)
            return true;

        if (response.OpenIdDiscoverySucceeded == false)
            return true;

        if (response.JwksConfigured == false)
            return true;

        if (response.Saml2Enabled && response.SpEntityIdConfigured == false)
            return true;

        if (response.Saml2Enabled && response.SamlRoleClaimSourcesConfigured == false)
            return true;

        if (response.TenantClaimMappingConfigured == false)
            return true;

        return false;
    }
}
