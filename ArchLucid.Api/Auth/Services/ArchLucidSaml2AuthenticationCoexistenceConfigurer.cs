using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Auth.Services;

/// <summary>
///     ITfoxtec <c>AddSaml2</c> calls <c>AddAuthentication(Saml2Constants.AuthenticationScheme)</c>, which sets SAML as the
///     default authenticate and challenge scheme. JSON APIs must keep the same primary scheme as
///     <see cref="AuthServiceCollectionExtensions.AddArchLucidAuth" /> (JWT Bearer, API key, or development bypass) so
///     <c>[Authorize]</c> and 401 responses negotiate Bearer (or the configured API scheme), not the SAML cookie login flow.
///     Sign-in and sign-out defaults remain the SAML cookie so ACS and SP logout can issue or clear the session cookie.
/// </summary>
internal sealed class ArchLucidSaml2AuthenticationCoexistenceConfigurer : IPostConfigureOptions<AuthenticationOptions>
{
    private readonly string _primaryApiAuthenticateScheme;

    public ArchLucidSaml2AuthenticationCoexistenceConfigurer(string primaryApiAuthenticateScheme)
    {
        if (string.IsNullOrWhiteSpace(primaryApiAuthenticateScheme))
            throw new ArgumentException(
                "Primary API authentication scheme is required.",
                nameof(primaryApiAuthenticateScheme));

        _primaryApiAuthenticateScheme = primaryApiAuthenticateScheme;
    }

    public void PostConfigure(string? name, AuthenticationOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        options.DefaultAuthenticateScheme = _primaryApiAuthenticateScheme;
        options.DefaultChallengeScheme = _primaryApiAuthenticateScheme;
        options.DefaultForbidScheme = _primaryApiAuthenticateScheme;
        options.DefaultSignInScheme = Saml2Constants.AuthenticationScheme;
        options.DefaultSignOutScheme = Saml2Constants.AuthenticationScheme;
    }
}
