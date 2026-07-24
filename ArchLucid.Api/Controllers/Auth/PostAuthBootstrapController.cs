using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Models.Auth;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Post-authentication workspace bootstrap (invitations, workspace selection, first workspace creation).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/bootstrap")]
public sealed class PostAuthBootstrapController(
    IPostAuthBootstrapService bootstrap,
    IAuthenticatedPlatformUserResolver platformUserResolver,
    ILocalTrialJwtIssuer jwtIssuer,
    IOptions<EmailOtpAuthOptions> emailOtpOptions,
    IAuditService auditService) : ControllerBase
{
    private readonly IPostAuthBootstrapService _bootstrap =
        bootstrap ?? throw new ArgumentNullException(nameof(bootstrap));

    private readonly IAuthenticatedPlatformUserResolver _platformUserResolver =
        platformUserResolver ?? throw new ArgumentNullException(nameof(platformUserResolver));

    private readonly ILocalTrialJwtIssuer _jwtIssuer =
        jwtIssuer ?? throw new ArgumentNullException(nameof(jwtIssuer));

    private readonly EmailOtpAuthOptions _emailOtpOptions =
        emailOtpOptions?.Value ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet("status")]
    [ProducesResponseType(typeof(PostAuthBootstrapStatusResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatusAsync(
        [FromQuery] string? returnUrl,
        [FromQuery] string? invitationToken,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? user = await ResolveUserAsync(cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Unauthorized();
        }

        if (!IdentityEmailNormalizer.TryNormalize(user.NormalizedPrimaryEmail ?? user.PrimaryEmail ?? string.Empty,
                out string normalizedEmail, out _))
        {
            return this.BadRequestProblem("A verified email address is required.", ProblemTypes.ValidationFailed);
        }

        string safeReturn = SanitizeReturnPath(returnUrl);
        PostAuthBootstrapStatusResult status =
            await _bootstrap.ResolveStatusAsync(user.Id, normalizedEmail, safeReturn, invitationToken, cancellationToken)
                .ConfigureAwait(false);

        return Ok(MapStatus(status));
    }

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

    [HttpPost("invitations/accept")]
    [EnableRateLimiting("bootstrap-workspace")]
    [ProducesResponseType(typeof(PostAuthBootstrapSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> AcceptInvitationAsync(
        [FromBody] PostAuthAcceptInvitationBody? body,
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

        if (!IdentityEmailNormalizer.TryNormalize(displayEmail, out string normalizedEmail, out displayEmail))
        {
            return this.BadRequestProblem("A verified email address is required.", ProblemTypes.ValidationFailed);
        }

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdminUserInvitationAccepted,
                ActorUserId = normalizedEmail,
                ActorUserName = normalizedEmail,
                DataJson = System.Text.Json.JsonSerializer.Serialize(new { channel = "post_auth_accept_invitation_http", invitationId = body.InvitationId })
            },
            cancellationToken).ConfigureAwait(false);

        PostAuthBootstrapSessionResult? accepted = await _bootstrap.AcceptInvitationAsync(
            user.Id,
            normalizedEmail,
            new PostAuthAcceptInvitationRequest
            {
                InvitationId = body.InvitationId,
                InvitationToken = body.InvitationToken,
                ConfirmEmailMismatch = body.ConfirmEmailMismatch
            },
            SanitizeReturnPath(returnUrl),
            cancellationToken).ConfigureAwait(false);

        if (accepted is null)
        {
            return this.BadRequestProblem(
                "That invitation is no longer available.",
                ProblemTypes.ValidationFailed);
        }

        try
        {
            return Ok(
                IssueSession(
                    user.Id,
                    displayEmail,
                    ResolveSessionRole(accepted.Role),
                    accepted.TenantId,
                    accepted.WorkspaceId,
                    accepted.ProjectId,
                    accepted.RedirectPath,
                    user.AuthVersion));
        }
        catch (InvalidOperationException ex) when (AuthBetaReadinessDiagnosticsEvaluator.IsLocalTrialJwtMisconfiguration(ex))
        {
            return this.ServiceUnavailableProblem(
                AuthBetaReadinessDiagnosticsEvaluator.SessionMintMisconfigurationDetail,
                ProblemTypes.UnavailableInProduction);
        }
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

    [HttpPost("access-request")]
    [EnableRateLimiting("bootstrap-workspace")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> InitiateAccessRequestAsync(
        [FromBody] PostAuthAccessRequestBody? body,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? user = await ResolveUserAsync(cancellationToken).ConfigureAwait(false);

        if (user is null)
        {
            return Unauthorized();
        }

        string displayEmail = user.PrimaryEmail?.Trim() ?? "user";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PostAuthAccessRequestInitiated,
                ActorUserId = displayEmail,
                ActorUserName = displayEmail,
                DataJson = System.Text.Json.JsonSerializer.Serialize(new { hasMessage = body?.Message is { Length: > 0 } })
            },
            cancellationToken).ConfigureAwait(false);

        return Accepted();
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

    private static PostAuthBootstrapStatusResponse MapStatus(PostAuthBootstrapStatusResult status) =>
        new()
        {
            Destination = status.Destination.ToString(),
            PendingInvitations = status.PendingInvitations
                .Select(row => new PostAuthBootstrapInvitationResponse
                {
                    InvitationId = row.InvitationId,
                    Label = row.Label,
                    MaskedInvitedEmail = row.MaskedInvitedEmail,
                    RequiresEmailMismatchConfirmation = row.RequiresEmailMismatchConfirmation,
                    ConfirmationMessage = row.ConfirmationMessage
                })
                .ToList(),
            Workspaces = status.Workspaces
                .Select(row => new PostAuthBootstrapWorkspaceResponse
                {
                    TenantId = row.TenantId,
                    WorkspaceId = row.WorkspaceId,
                    WorkspaceName = row.WorkspaceName
                })
                .ToList(),
            ResumePath = status.ResumePath,
            DuplicateOrganization = MapDuplicate(status.DuplicateOrganization),
            CanCreateWorkspace = status.CanCreateWorkspace,
            DenialReason = status.DenialReason
        };

    private static PostAuthBootstrapDuplicateOrganizationResponse? MapDuplicate(
        PostAuthBootstrapDuplicateOrganizationHint? hint)
    {
        if (hint is null || !hint.Detected)
        {
            return null;
        }

        return new PostAuthBootstrapDuplicateOrganizationResponse
        {
            Detected = hint.Detected,
            AccessRequestRecommended = hint.AccessRequestRecommended,
            CustomerMessage = hint.CustomerMessage
        };
    }
}
