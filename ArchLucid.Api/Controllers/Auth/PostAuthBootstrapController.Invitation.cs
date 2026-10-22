using ArchLucid.Api.Models.Auth;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Api.Services.Admin;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using ArchLucid.Host.Core.ProblemDetails;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Auth;

public sealed partial class PostAuthBootstrapController
{
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
}
