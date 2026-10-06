using ArchLucid.Core.Identity;

namespace ArchLucid.Api.Services.Admin;

internal static class IdentityProviderProtocolParser
{
    internal static bool TryParse(string? protocol, out TenantIdentityProtocol parsedProtocol)
    {
        string normalized = protocol?.Trim().ToLowerInvariant() ?? string.Empty;

        switch (normalized)
        {
            case "oidc":
                parsedProtocol = TenantIdentityProtocol.Oidc;
                return true;

            case "saml":
                parsedProtocol = TenantIdentityProtocol.Saml;
                return true;

            default:
                parsedProtocol = default;
                return false;
        }
    }

    internal static string ToWizardToken(TenantIdentityProtocol protocol) =>
        protocol switch
        {
            TenantIdentityProtocol.Oidc => "oidc",
            TenantIdentityProtocol.Saml => "saml",
            _ => throw new ArgumentOutOfRangeException(nameof(protocol), protocol, null)
        };
}
