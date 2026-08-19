using System.Text.Json;

using ArchLucid.Api.Models.Auth;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Anonymous sign-in routing for email domains without revealing tenant metadata.</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/routing")]
public sealed class AuthSignInRoutingController(
    IAuthSignInRoutingService routingService,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuthSignInRoutingService _routingService =
        routingService ?? throw new ArgumentNullException(nameof(routingService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    [HttpPost("evaluate")]
    [EnableRateLimiting("email-otp")]
    [MutatingAuditExcluded("Read-only routing evaluation; audit emitted explicitly without tenant disclosure.")]
    [ProducesResponseType(typeof(AuthSignInRoutingResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> EvaluateAsync(
        [FromBody] AuthSignInRoutingEvaluateBody? body,
        CancellationToken cancellationToken)
    {
        if (body?.Email is null)
        {
            return this.BadRequestProblem("Email is required.", ProblemTypes.ValidationFailed);
        }

        if (!IdentityEmailNormalizer.TryNormalize(body.Email, out string normalizedEmail, out _))
        {
            return Ok(
                new AuthSignInRoutingResponse
                {
                    AllowEmailCode = true,
                    SsoRequired = false,
                    ReturnPath = AuthSignInReturnPathGuard.TryNormalize(body.ReturnPath)
                });
        }

        string actorId = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail);

        AuthSignInRoutingEvaluation evaluation = await _routingService.EvaluateAsync(
            new Application.Identity.AuthSignInRoutingRequest
            {
                NormalizedEmail = normalizedEmail,
                InvitationToken = body.InvitationToken,
                ReturnPath = body.ReturnPath
            },
            cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AuthSignInRoutingEvaluated,
                ActorUserId = actorId,
                ActorUserName = actorId,
                ExplicitActor = true,
                TenantId = Guid.Empty,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        ssoRequired = evaluation.SsoRequired,
                        hasInvitationToken = !string.IsNullOrWhiteSpace(body.InvitationToken)
                    })
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(
            new AuthSignInRoutingResponse
            {
                AllowEmailCode = evaluation.AllowEmailCode,
                SsoRequired = evaluation.SsoRequired,
                Message = evaluation.SsoRequired ? evaluation.CustomerMessage : null,
                ReturnPath = evaluation.SafeReturnPath
            });
    }
}
