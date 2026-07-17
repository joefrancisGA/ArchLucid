using System.Text.Json;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.Models.Auth;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Security;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Passwordless email one-time-code sign-in (<c>Auth:EmailOtp:Enabled</c>).</summary>
[ApiController]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/email-otp")]
public sealed class EmailOtpAuthController(
    IOptions<EmailOtpAuthOptions> emailOtpOptions,
    IEmailOtpAuthService emailOtpAuth,
    ILocalTrialJwtIssuer jwtIssuer,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IEmailOtpAuthService _emailOtpAuth =
        emailOtpAuth ?? throw new ArgumentNullException(nameof(emailOtpAuth));

    private readonly EmailOtpAuthOptions _emailOtpOptions =
        emailOtpOptions?.Value ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    private readonly ILocalTrialJwtIssuer _jwtIssuer = jwtIssuer ?? throw new ArgumentNullException(nameof(jwtIssuer));

    /// <summary>Requests a short-lived sign-in code for the supplied email address.</summary>
    [HttpPost("challenge")]
    [EnableRateLimiting("email-otp")]
    [ProducesResponseType(typeof(EmailOtpChallengeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RequestChallengeAsync(
        [FromBody] ArchLucid.Api.Models.Auth.EmailOtpChallengeRequest? body,
        CancellationToken cancellationToken)
    {
        if (!IsEmailOtpEnabled())
        {
            return this.NotFoundProblem("Email one-time-code sign-in is not enabled for this environment.", ProblemTypes.ResourceNotFound);
        }

        if (body?.Email is null)
        {
            return this.BadRequestProblem("Email is required.", ProblemTypes.ValidationFailed);
        }

        string actorId = ResolveEmailCorrelationActor(body.Email);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.EmailOtpCodeRequested,
                ActorUserId = actorId,
                ActorUserName = actorId,
                ExplicitActor = true,
                TenantId = Guid.Empty,
                DataJson = JsonSerializer.Serialize(new { channel = "email_otp_challenge_http" })
            },
            cancellationToken).ConfigureAwait(false);

        EmailOtpChallengeRequestResult result = await _emailOtpAuth.RequestCodeAsync(
            new Application.Identity.EmailOtpChallengeRequest
            {
                Email = body.Email,
                InvitationToken = body.InvitationToken,
                BotChallengeToken = body.BotChallengeToken,
                ClientIp = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers.UserAgent.ToString()
            },
            cancellationToken).ConfigureAwait(false);

        return Ok(
            new EmailOtpChallengeResponse
            {
                Message = result.Message,
                ChallengeId = result.ChallengeId,
                SsoRequired = result.SsoRequired,
                SsoMessage = result.SsoMessage,
                EmailDeliverySucceeded = result.EmailDeliverySucceeded
            });
    }

    /// <summary>Verifies a sign-in code and issues an access token.</summary>
    [HttpPost("verify")]
    [EnableRateLimiting("email-otp")]
    [ProducesResponseType(typeof(EmailOtpVerifyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyAsync(
        [FromBody] ArchLucid.Api.Models.Auth.EmailOtpVerifyRequest? body,
        CancellationToken cancellationToken)
    {
        if (!IsEmailOtpEnabled())
        {
            return this.NotFoundProblem("Email one-time-code sign-in is not enabled for this environment.", ProblemTypes.ResourceNotFound);
        }

        if (body is null || body.ChallengeId == Guid.Empty || string.IsNullOrWhiteSpace(body.Code))
        {
            return this.BadRequestProblem("ChallengeId and code are required.", ProblemTypes.ValidationFailed);
        }

        string actorId = $"challenge:{body.ChallengeId:D}";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.EmailOtpCodeRequested,
                ActorUserId = actorId,
                ActorUserName = actorId,
                ExplicitActor = true,
                TenantId = Guid.Empty,
                DataJson = JsonSerializer.Serialize(new { channel = "email_otp_verify_http" })
            },
            cancellationToken).ConfigureAwait(false);

        EmailOtpVerifyResult result = await _emailOtpAuth.VerifyCodeAsync(
            new Application.Identity.EmailOtpVerifyRequest
            {
                ChallengeId = body.ChallengeId,
                Code = body.Code,
                InvitationToken = body.InvitationToken
            },
            cancellationToken).ConfigureAwait(false);

        if (!result.Succeeded || result.PlatformUserId is null || result.DisplayEmail is null)
        {
            return Unauthorized();
        }

        Guid tenantId = result.TenantId ?? Guid.Empty;
        Guid workspaceId = result.WorkspaceId ?? Guid.Empty;
        (Guid defaultTenantId, Guid defaultWorkspaceId, Guid projectId) = TrialLocalJwtScopeDefaults.Resolve();

        if (tenantId == Guid.Empty)
        {
            tenantId = defaultTenantId;
        }

        if (workspaceId == Guid.Empty)
        {
            workspaceId = defaultWorkspaceId;
        }

        int lifetimeSeconds = Math.Clamp(_emailOtpOptions.AccessTokenLifetimeMinutes, 5, 24 * 60) * 60;

        string jwt = _jwtIssuer.IssueAccessToken(
            result.PlatformUserId.Value,
            result.DisplayEmail,
            result.Role,
            tenantId,
            workspaceId,
            projectId,
            result.AuthVersion);

        return Ok(
            new EmailOtpVerifyResponse
            {
                AccessToken = jwt,
                TokenType = "Bearer",
                ExpiresInSeconds = lifetimeSeconds,
                PlatformUserId = result.PlatformUserId.Value,
                NextStep = result.NextStep.ToString(),
                TenantId = result.TenantId,
                WorkspaceId = result.WorkspaceId,
                InvitationId = result.InvitationId
            });
    }

    private bool IsEmailOtpEnabled() => _emailOtpOptions.Enabled;

    private static string ResolveEmailCorrelationActor(string email)
    {
        if (!IdentityEmailNormalizer.TryNormalize(email, out string normalizedEmail, out _))
        {
            return "invalid-email";
        }

        return EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail);
    }
}
