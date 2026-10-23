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
    /// <summary>Max Bearer credentials honored per request (HTTP combination + comma folding).</summary>
    internal const int MaxBearerCredentialsPerRequest = 2;

    private readonly IScimBearerTokenAuthenticator _authenticator =
        authenticator ?? throw new ArgumentNullException(nameof(authenticator));

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out StringValues header))
            return AuthenticateResult.Fail("Missing Authorization header.");

        AuthorizationBearerParseResult parseResult = TryParseBearerCredentials(header);

        if (parseResult.ErrorMessage is not null)
            return AuthenticateResult.Fail(parseResult.ErrorMessage);

        if (parseResult.BearerTokens.Count == 0)
            return AuthenticateResult.Fail("Authorization must use Bearer scheme.");

        List<ScimBearerAuthenticationResult> successfulAuths = [];
        HashSet<string> distinctTokens = new(StringComparer.Ordinal);

        foreach (string token in parseResult.BearerTokens)
        {

            if (!distinctTokens.Add(token))
            {
                continue;
            }
            ScimBearerAuthenticationResult? auth =
                await _authenticator.TryAuthenticateAsync(token, Context.RequestAborted);

            if (auth is not null)
            {
                successfulAuths.Add(auth);
            }
        }

        if (successfulAuths.Count == 0)
            return AuthenticateResult.Fail("Invalid or revoked SCIM token.");

        if (successfulAuths.Select(static a => a.TenantId).Distinct().Count() > 1)
            return AuthenticateResult.Fail("Authorization presents conflicting tenant credentials.");

        ScimBearerAuthenticationResult selectedAuth = successfulAuths[0];

        Claim[] claims =
        [
            new("tenant_id", selectedAuth.TenantId.ToString("D")),
            new("scim_token_id", selectedAuth.TokenRowId.ToString("D"))
        ];

        ClaimsIdentity identity = new(claims, ScimBearerDefaults.AuthenticationScheme);
        ClaimsPrincipal principal = new(identity);

        return AuthenticateResult.Success(new AuthenticationTicket(principal, ScimBearerDefaults.AuthenticationScheme));
    }

    private readonly record struct AuthorizationBearerParseResult(
        IReadOnlyList<string> BearerTokens,
        string? ErrorMessage);

    private static AuthorizationBearerParseResult TryParseBearerCredentials(StringValues authorizationHeader)
    {
        List<string> tokens = [];
        bool sawBearerCredential = false;
        bool sawNonBearerCredential = false;

        foreach (string? headerValue in authorizationHeader)
        {

            if (string.IsNullOrWhiteSpace(headerValue))
            {
                continue;
            }

            // HTTP field combination can fold duplicate Authorization values into one comma-separated header.
            // Some gateways join multiple Bearer lines with LF instead of a comma.

            foreach (string segment in SplitAuthorizationCredentialSegments(headerValue))
            {
                string normalizedSegment = segment.TrimStart('\uFEFF');

                if (TryReadBearerCredentialSegment(normalizedSegment, out string bearerToken))
                {
                    sawBearerCredential = true;

                    if (string.IsNullOrWhiteSpace(bearerToken))
                    {
                        continue;
                    }

                    tokens.Add(bearerToken);

                    continue;
                }

                sawNonBearerCredential = true;
            }
        }

        if (sawBearerCredential && sawNonBearerCredential)
        {
            return new AuthorizationBearerParseResult(
                [],
                "Authorization mixes Bearer credentials with other schemes.");
        }

        if (tokens.Count > MaxBearerCredentialsPerRequest)
        {
            return new AuthorizationBearerParseResult(
                [],
                "Authorization presents too many Bearer credentials.");
        }

        return new AuthorizationBearerParseResult(tokens, null);
    }

    private static IEnumerable<string> SplitAuthorizationCredentialSegments(string headerValue) =>
        headerValue.Split([',', '\n', '\r'], StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

    private static bool TryReadBearerCredentialSegment(string segment, out string bearerToken)
    {
        bearerToken = string.Empty;

        if (!segment.StartsWith("Bearer", StringComparison.OrdinalIgnoreCase))
            return false;

        if (segment.Length <= 6)
            return false;

        if (!char.IsWhiteSpace(segment[6]))
            return false;

        bearerToken = segment[6..].Trim();

        return true;
    }
}
