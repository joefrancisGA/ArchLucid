using System.Security.Claims;
using System.Text.Encodings.Web;

using ArchLucid.Api.Auth.Models;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;

namespace ArchLucid.Api.Auth.Services;

public class DevelopmentBypassAuthenticationHandler(
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
        Guid tenantId = opts.DevTenantId ?? ScopeIds.DefaultTenant;
        Guid workspaceId = opts.DevWorkspaceId ?? ScopeIds.DefaultWorkspace;
        Guid projectId = opts.DevProjectId ?? ScopeIds.DefaultProject;

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

            // TB-072 binds scope claims to x-* headers; honor headers in test hosts so post-registration flows can steer scope.
            if (TryParseScopeHeader(req, "x-tenant-id", out Guid tenantFromHeader))
                tenantId = tenantFromHeader;

            if (TryParseScopeHeader(req, "x-workspace-id", out Guid workspaceFromHeader))
                workspaceId = workspaceFromHeader;

            if (TryParseScopeHeader(req, "x-project-id", out Guid projectFromHeader))
                projectId = projectFromHeader;
        }

        List<Claim> claims =
        [
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Name, userName),
            new("oid", userId),
            new(ClaimTypes.Role, role),
            new("tenant_id", tenantId.ToString("D")),
            new("workspace_id", workspaceId.ToString("D")),
            new("project_id", projectId.ToString("D"))
        ];

        ClaimsIdentity identity = new(claims, SchemeName);
        ClaimsPrincipal principal = new(identity);
        AuthenticationTicket ticket = new(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }

    private static bool TryParseScopeHeader(HttpRequest request, string headerName, out Guid value)
    {
        value = Guid.Empty;

        if (!request.Headers.TryGetValue(headerName, out StringValues headerRaw))
            return false;

        string text = headerRaw.ToString().Trim();

        return text.Length > 0 && Guid.TryParse(text, out value);
    }
}
