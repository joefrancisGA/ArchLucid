using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Audit;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Auth;

public sealed partial class AuthenticationSignInMethodsController
{
    [HttpPost("proposals/{proposalId:guid}/confirm")]
    [ProducesResponseType(typeof(SignInMethodConfirmedResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmProposalAsync(Guid proposalId, CancellationToken cancellationToken)
    {
        IActionResult? recentAuthError = EnsureRecentAuthenticationOrError();

        if (recentAuthError is not null)
        {
            return recentAuthError;
        }

        PlatformUserRecord user = await RequirePlatformUserAsync(cancellationToken).ConfigureAwait(false);
        string actorId = ResolveActorId(user);

        try
        {
            AuthenticationIdentityRecord identity = await _linkingService
                .ConfirmLinkProposalAsync(user.Id, proposalId, actorId, cancellationToken)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AuthenticationIdentityLinkConfirmed,
                    ActorUserId = actorId,
                    ActorUserName = User.Identity?.Name ?? actorId,
                    ExplicitActor = true,
                    TenantId = Guid.Empty,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(
                        new { proposalId, identityId = identity.Id })
                },
                cancellationToken).ConfigureAwait(false);

            return Ok(
                new SignInMethodConfirmedResponse
                {
                    IdentityId = identity.Id,
                    ProviderType = identity.ProviderType.ToString()
                });
        }
        catch (AuthenticationIdentityLinkProposalNotFoundException)
        {
            return this.NotFoundProblem("Link proposal was not found.", ProblemTypes.ResourceNotFound);
        }
        catch (AuthenticationIdentityLinkProposalExpiredException)
        {
            return this.BadRequestProblem("Link proposal has expired.", ProblemTypes.ValidationFailed);
        }
        catch (IdentityAlreadyAttachedToAnotherUserException)
        {
            return this.BadRequestProblem(
                "This sign-in method is already linked to another account.",
                ProblemTypes.ValidationFailed);
        }
    }

    [HttpDelete("proposals/{proposalId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> CancelProposalAsync(Guid proposalId, CancellationToken cancellationToken)
    {
        IActionResult? recentAuthError = EnsureRecentAuthenticationOrError();

        if (recentAuthError is not null)
        {
            return recentAuthError;
        }

        PlatformUserRecord user = await RequirePlatformUserAsync(cancellationToken).ConfigureAwait(false);
        string actorId = ResolveActorId(user);

        try
        {
            await _linkingService
                .CancelLinkProposalAsync(user.Id, proposalId, actorId, cancellationToken)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AuthenticationIdentityLinkCancelled,
                    ActorUserId = actorId,
                    ActorUserName = User.Identity?.Name ?? actorId,
                    ExplicitActor = true,
                    TenantId = Guid.Empty,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new { proposalId })
                },
                cancellationToken).ConfigureAwait(false);

            return NoContent();
        }
        catch (AuthenticationIdentityLinkProposalNotFoundException)
        {
            return this.NotFoundProblem("Link proposal was not found.", ProblemTypes.ResourceNotFound);
        }
    }
}
