using System.Security.Claims;
using System.Text.Encodings.Web;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Auth.Services;

public sealed class DevelopmentBypassAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IOptions<ArchLucidAuthOptions> authOptions,
    IHostEnvironment hostEnvironment)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "DevelopmentBypass";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        ArchLucidAuthOptions opts = authOptions.Value;

        if (opts.AllowTestActorHeaders && hostEnvironment.IsProduction())

            throw new InvalidOperationException(
                "ArchLucidAuth:AllowTestActorHeaders must not be enabled in Production.");

        string role = string.IsNullOrWhiteSpace(opts.DevRole) ? ArchLucidRoles.Admin : opts.DevRole.Trim();

        string userId = opts.DevUserId.Trim();
        string userName = opts.DevUserName.Trim();

        if (opts.AllowTestActorHeaders)
        {
            HttpRequest req = Request;

            if (req.Headers.TryGetValue(ArchLucidAuthOptions.TestActorNameHeader, out StringValues actorNameValues))
            {
                string trimmed = actorNameValues.ToString().Trim();

                if (trimmed.Length > 0)
                    userName = trimmed;
            }

            if (req.Headers.TryGetValue(ArchLucidAuthOptions.TestActorIdHeader, out StringValues actorIdValues))
            {
                string trimmed = actorIdValues.ToString().Trim();

                if (trimmed.Length > 0)
                    userId = trimmed;
            }
        }

        List<Claim> claims =
        [
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, userName),
            new("oid", userId),
            new(ClaimTypes.Role, role)
        ];

        ClaimsIdentity identity = new(claims, SchemeName);
        ClaimsPrincipal principal = new(identity);
        AuthenticationTicket ticket = new(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
