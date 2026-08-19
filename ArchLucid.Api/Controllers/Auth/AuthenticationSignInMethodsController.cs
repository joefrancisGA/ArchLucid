using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Account sign-in methods and safe identity linking for the authenticated platform user.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/sign-in-methods")]
public sealed class AuthenticationSignInMethodsController(
    IAuthenticationIdentityLinkingService linkingService,
    IAuthenticatedPlatformUserResolver userResolver,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuthenticationIdentityLinkingService _linkingService =
        linkingService ?? throw new ArgumentNullException(nameof(linkingService));

    private readonly IAuthenticatedPlatformUserResolver _userResolver =
        userResolver ?? throw new ArgumentNullException(nameof(userResolver));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

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

    [HttpDelete("{identityId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveAsync(Guid identityId, CancellationToken cancellationToken)
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
            await _linkingService.RemoveSignInMethodAsync(user.Id, identityId, actorId, cancellationToken)
                .ConfigureAwait(false);

            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AuthenticationIdentityRemovalRequested,
                    ActorUserId = actorId,
                    ActorUserName = User.Identity?.Name ?? actorId,
                    ExplicitActor = true,
                    TenantId = Guid.Empty,
                    DataJson = System.Text.Json.JsonSerializer.Serialize(new { identityId })
                },
                cancellationToken).ConfigureAwait(false);

            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (SignInMethodRemovalBlockedException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (FinalSignInMethodRemovalException)
        {
            return this.BadRequestProblem(
                "At least one sign-in method must remain on your account.",
                ProblemTypes.ValidationFailed);
        }
    }

    private IActionResult? EnsureRecentAuthenticationOrError()
    {
        if (!RecentAuthenticationEvaluator.HasRecentAuthentication(User, TimeProvider.System))
        {
            return this.BadRequestProblem(
                "Recent authentication is required. Sign in again and retry.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private async Task<PlatformUserRecord> RequirePlatformUserAsync(CancellationToken cancellationToken)
    {
        PlatformUserRecord? user =
            await _userResolver.ResolveAsync(User, cancellationToken).ConfigureAwait(false);

        if (user is null)
            throw new UnauthorizedAccessException("Authenticated platform user is required.");

        return user;
    }

    private static string ResolveActorId(PlatformUserRecord user) => user.Id.ToString("D");
}

public sealed class EmailLinkChallengeRequest
{
    public string Email
    {
        get;
        init;
    } = string.Empty;
}

public sealed class EmailLinkChallengeResponse
{
    public Guid ChallengeId
    {
        get;
        init;
    }
}

public sealed class EmailLinkVerifyRequest
{
    public Guid ChallengeId
    {
        get;
        init;
    }

    public string Code
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SignInMethodConfirmedResponse
{
    public Guid IdentityId
    {
        get;
        init;
    }

    public string ProviderType
    {
        get;
        init;
    } = string.Empty;
}
