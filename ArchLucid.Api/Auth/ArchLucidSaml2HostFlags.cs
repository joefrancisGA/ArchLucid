using ArchLucid.Api.Auth.Models;

namespace ArchLucid.Api.Auth;

/// <summary>Host-level feature flag for SAML 2.0 SP wiring (must stay in sync with <see cref="ArchLucidSaml2ServiceExtensions" />).</summary>
internal static class ArchLucidSaml2HostFlags
{
    internal static bool IsSaml2Enabled(IConfiguration configuration) =>
        configuration.GetValue<bool>($"{ArchLucidSamlAuthOptions.ConfigurationSectionPath}:Enabled");
}
