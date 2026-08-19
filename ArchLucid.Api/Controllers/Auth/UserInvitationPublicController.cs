using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Anonymous invitation validation before sign-in (minimal disclosure).</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/invitations")]
public sealed class UserInvitationPublicController(
    IUserInvitationFlowService invitationFlow,
    IAuditService auditService) : ControllerBase
{
    private readonly IUserInvitationFlowService _invitationFlow =
        invitationFlow ?? throw new ArgumentNullException(nameof(invitationFlow));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpGet("validate")]
    [EnableRateLimiting("auth-routing")]
    [MutatingAuditExcluded("Read-only invitation validation.")]
    [ProducesResponseType(typeof(InvitationValidationResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateAsync(
        [FromQuery] string? token,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return this.BadRequestProblem("Invitation token is required.", ProblemTypes.ValidationFailed);
        }

        InvitationPublicValidationResult result =
            await _invitationFlow.ValidateTokenPublicAsync(token, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.UserInvitationValidated,
                ActorUserId = "anonymous",
                ActorUserName = "anonymous",
                ExplicitActor = true,
                TenantId = Guid.Empty,
                DataJson = System.Text.Json.JsonSerializer.Serialize(
                    new { status = result.Status.ToString(), hasToken = true })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(
            new InvitationValidationResponse
            {
                Status = result.Status.ToString(),
                MaskedInvitedEmail = result.MaskedInvitedEmail,
                AllowEmailCode = result.AllowEmailCode,
                RequireEnterpriseSso = result.RequireEnterpriseSso,
                RoutingMessage = result.RoutingMessage,
                AppRole = result.AppRole
            });
    }
}

public sealed class InvitationValidationResponse
{
    public string Status
    {
        get;
        init;
    } = string.Empty;

    public string? MaskedInvitedEmail
    {
        get;
        init;
    }

    public bool AllowEmailCode
    {
        get;
        init;
    }

    public bool RequireEnterpriseSso
    {
        get;
        init;
    }

    public string? RoutingMessage
    {
        get;
        init;
    }

    public string? AppRole
    {
        get;
        init;
    }
}
