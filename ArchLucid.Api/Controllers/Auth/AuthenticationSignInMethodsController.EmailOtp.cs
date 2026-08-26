using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Auth;

public sealed partial class AuthenticationSignInMethodsController
{
    [HttpGet]
    [MutatingAuditExcluded("Read-only sign-in method list.")]
    [ProducesResponseType(typeof(IReadOnlyList<SignInMethodSummary>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(CancellationToken cancellationToken)
    {
        PlatformUserRecord user = await RequirePlatformUserAsync(cancellationToken).ConfigureAwait(false);

        IReadOnlyList<SignInMethodSummary> rows =
            await _linkingService.ListSignInMethodsAsync(user.Id, cancellationToken).ConfigureAwait(false);

        return Ok(rows);
    }

    [HttpPost("email-otp/challenge")]
    [ProducesResponseType(typeof(EmailLinkChallengeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> RequestEmailLinkChallengeAsync(
        [FromBody] EmailLinkChallengeRequest? body,
        CancellationToken cancellationToken)
    {
        IActionResult? recentAuthError = EnsureRecentAuthenticationOrError();

        if (recentAuthError is not null)
        {
            return recentAuthError;
        }

        if (body is null || string.IsNullOrWhiteSpace(body.Email))
        {
            return this.BadRequestProblem("Email is required.", ProblemTypes.ValidationFailed);
        }

        PlatformUserRecord user = await RequirePlatformUserAsync(cancellationToken).ConfigureAwait(false);
        string actorId = ResolveActorId(user);

        try
        {
            Guid challengeId = await _linkingService
                .RequestEmailLinkChallengeAsync(user.Id, body.Email, actorId, cancellationToken)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AuthenticationIdentityLinkChallengeRequested,
                    ActorUserId = actorId,
                    ActorUserName = User.Identity?.Name ?? actorId,
                    ExplicitActor = true,
                    TenantId = Guid.Empty,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new { channel = "http" })
                },
                cancellationToken).ConfigureAwait(false);

            return Ok(new EmailLinkChallengeResponse { ChallengeId = challengeId });
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (IdentityAlreadyAttachedToAnotherUserException)
        {
            return this.BadRequestProblem(
                "This sign-in method is already linked to another account.",
                ProblemTypes.ValidationFailed);
        }
    }

    [HttpPost("email-otp/verify")]
    [ProducesResponseType(typeof(AuthenticationIdentityLinkProposalView), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyEmailLinkChallengeAsync(
        [FromBody] EmailLinkVerifyRequest? body,
        CancellationToken cancellationToken)
    {
        IActionResult? recentAuthError = EnsureRecentAuthenticationOrError();

        if (recentAuthError is not null)
        {
            return recentAuthError;
        }

        if (body is null || body.ChallengeId == Guid.Empty || string.IsNullOrWhiteSpace(body.Code))
        {
            return this.BadRequestProblem("ChallengeId and code are required.", ProblemTypes.ValidationFailed);
        }

        PlatformUserRecord user = await RequirePlatformUserAsync(cancellationToken).ConfigureAwait(false);
        string actorId = ResolveActorId(user);

        try
        {
            AuthenticationIdentityLinkProposalView proposal = await _linkingService
                .VerifyEmailLinkChallengeAsync(user.Id, body.ChallengeId, body.Code, actorId, cancellationToken)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AuthenticationIdentityLinkProposed,
                    ActorUserId = actorId,
                    ActorUserName = User.Identity?.Name ?? actorId,
                    ExplicitActor = true,
                    TenantId = Guid.Empty,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(
                        new { proposalId = proposal.ProposalId, providerType = proposal.ProviderType })
                },
                cancellationToken).ConfigureAwait(false);

            return Ok(proposal);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (IdentityAlreadyAttachedToAnotherUserException)
        {
            return this.BadRequestProblem(
                "This sign-in method is already linked to another account.",
                ProblemTypes.ValidationFailed);
        }
    }
}
