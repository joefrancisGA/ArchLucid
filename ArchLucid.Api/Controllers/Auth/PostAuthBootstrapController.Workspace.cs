using ArchLucid.Api.Models.Auth;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Auth;

public sealed partial class PostAuthBootstrapController
{
    [HttpPost("workspaces")]
    [EnableRateLimiting("bootstrap-workspace")]
    [ProducesResponseType(typeof(PostAuthCreateWorkspaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateWorkspaceAsync(
        [FromBody] PostAuthCreateWorkspaceBody? body,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? user = await ResolveUserAsync(cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Unauthorized();
        }

        if (body is null)
        {
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PostAuthWorkspaceCreated,
                ActorUserId = $"platform-user:{user.Id:D}",
                ActorUserName = $"platform-user:{user.Id:D}",
                DataJson = System.Text.Json.JsonSerializer.Serialize(new { channel = "post_auth_create_workspace_http" })
            },
            cancellationToken).ConfigureAwait(false);

        string displayEmail = user.PrimaryEmail?.Trim() ?? string.Empty;

        if (!IdentityEmailNormalizer.TryNormalize(displayEmail, out string normalizedEmail, out displayEmail))
        {
            return this.BadRequestProblem("A verified email address is required.", ProblemTypes.ValidationFailed);
        }

        PostAuthCreateWorkspaceResult result = await _bootstrap.CreateWorkspaceAsync(
            user.Id,
            normalizedEmail,
            displayEmail,
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = body.WorkspaceName,
                OrganizationName = body.OrganizationName,
                DataRegion = body.DataRegion,
                IndustryVertical = body.IndustryVertical,
                IndustryVerticalOther = body.IndustryVerticalOther,
                TermsAccepted = body.TermsAccepted,
                IncludeDemoSeed = body.IncludeDemoSeed,
                InvitationToken = body.InvitationToken
            },
            cancellationToken).ConfigureAwait(false);

        if (!result.Succeeded || result.TenantId is null || result.WorkspaceId is null || result.ProjectId is null)
        {
            return Ok(
                new PostAuthCreateWorkspaceResponse
                {
                    Succeeded = false,
                    CustomerMessage = result.CustomerMessage,
                    DuplicateOrganization = MapDuplicate(result.DuplicateOrganization)
                });
        }

        PostAuthBootstrapSessionResponse session = IssueSession(
            user.Id,
            displayEmail,
            ArchLucid.Core.Authorization.ArchLucidRoles.WorkspaceAdmin,
            result.TenantId.Value,
            result.WorkspaceId.Value,
            result.ProjectId.Value,
            result.OnboardingPath,
            user.AuthVersion);

        return Ok(
            new PostAuthCreateWorkspaceResponse
            {
                Succeeded = true,
                OnboardingPath = result.OnboardingPath,
                Session = session
            });
    }

    [HttpPost("workspaces/select")]
    [ProducesResponseType(typeof(PostAuthBootstrapSessionResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> SelectWorkspaceAsync(
        [FromBody] PostAuthSelectWorkspaceBody? body,
        [FromQuery] string? returnUrl,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? user = await ResolveUserAsync(cancellationToken).ConfigureAwait(false);

        if (user is null || body is null)
        {
            return body is null
                ? this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired)
                : Unauthorized();
        }

        string displayEmail = user.PrimaryEmail?.Trim() ?? string.Empty;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PostAuthWorkspaceCreated,
                ActorUserId = $"platform-user:{user.Id:D}",
                ActorUserName = $"platform-user:{user.Id:D}",
                TenantId = body.TenantId,
                WorkspaceId = body.WorkspaceId,
                DataJson = System.Text.Json.JsonSerializer.Serialize(new { channel = "post_auth_select_workspace_http" })
            },
            cancellationToken).ConfigureAwait(false);

        PostAuthBootstrapSessionResult? selected = await _bootstrap.SelectWorkspaceAsync(
            user.Id,
            new PostAuthSelectWorkspaceRequest
            {
                TenantId = body.TenantId,
                WorkspaceId = body.WorkspaceId
            },
            SanitizeReturnPath(returnUrl),
            cancellationToken).ConfigureAwait(false);

        if (selected is null)
        {
            return this.BadRequestProblem("That workspace is not available.", ProblemTypes.ValidationFailed);
        }

        return Ok(
            IssueSession(
                user.Id,
                displayEmail,
                ResolveSessionRole(selected.Role),
                selected.TenantId,
                selected.WorkspaceId,
                selected.ProjectId,
                selected.RedirectPath,
                user.AuthVersion));
    }

    private async Task<PlatformUserRecord?> ResolveUserAsync(CancellationToken cancellationToken) =>
        await _platformUserResolver.ResolveAsync(User, cancellationToken).ConfigureAwait(false);

    private PostAuthBootstrapSessionResponse IssueSession(
        Guid platformUserId,
        string displayEmail,
        string role,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string redirectPath,
        Guid authVersion)
    {
        int lifetimeSeconds = Math.Clamp(_emailOtpOptions.AccessTokenLifetimeMinutes, 5, 24 * 60) * 60;

        string jwt = _jwtIssuer.IssueAccessToken(
            platformUserId,
            displayEmail,
            role,
            tenantId,
            workspaceId,
            projectId,
            authVersion);

        return new PostAuthBootstrapSessionResponse
        {
            AccessToken = jwt,
            TokenType = "Bearer",
            ExpiresInSeconds = lifetimeSeconds,
            RedirectPath = SanitizeReturnPath(redirectPath)
        };
    }

    private static string ResolveSessionRole(string? membershipRole)
    {
        if (string.IsNullOrWhiteSpace(membershipRole))
        {
            return ArchLucid.Core.Authorization.ArchLucidRoles.Reader;
        }

        return membershipRole.Trim();
    }

    private static string SanitizeReturnPath(string? returnUrl) =>
        AuthSignInReturnPathGuard.TryNormalize(returnUrl) ?? "/";
}
