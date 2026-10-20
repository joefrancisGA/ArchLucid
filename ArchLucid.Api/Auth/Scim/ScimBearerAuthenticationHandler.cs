using System.Security.Claims;
using System.Text.Encodings.Web;

using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Auth.Scim;

internal class ScimBearerAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IScimBearerTokenAuthenticator authenticator)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    private readonly IScimBearerTokenAuthenticator _authenticator =
        authenticator ?? throw new ArgumentNullException(nameof(authenticator));

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out StringValues header))
            return AuthenticateResult.Fail("Missing Authorization header.");

        if (!TryReadBearerToken(header, out string token))
            return AuthenticateResult.Fail("Authorization must use Bearer scheme.");

        ScimBearerAuthenticationResult? auth =
            await _authenticator.TryAuthenticateAsync(token, Context.RequestAborted);

        if (auth is null)
            return AuthenticateResult.Fail("Invalid or revoked SCIM token.");

        Claim[] claims =
        [
            new("tenant_id", auth.TenantId.ToString("D")),
            new("scim_token_id", auth.TokenRowId.ToString("D"))
        ];

        ClaimsIdentity identity = new(claims, ScimBearerDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new(identity);

        return AuthenticateResult.Success(new AuthenticationTicket(principal, ScimBearerDefaults.AuthenticationScheme));
    }

    private static bool TryReadBearerToken(StringValues authorizationHeader, out string bearerToken)
    {
        foreach (string? headerValue in authorizationHeader)
        {

            if (string.IsNullOrWhiteSpace(headerValue))
            {
                continue;
            }

            // HTTP field combination can fold duplicate Authorization values into one comma-separated header.
            foreach (string segment in headerValue.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
            {

                if (!segment.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                string candidate = segment["Bearer ".Length..].Trim();

                if (string.IsNullOrWhiteSpace(candidate))
                {
                    continue;
                }

                bearerToken = candidate;

                return true;
            }
        }

        bearerToken = string.Empty;

        return false;
    }
}
