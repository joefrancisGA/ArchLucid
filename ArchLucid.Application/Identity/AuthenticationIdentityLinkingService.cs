using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed class SignInMethodSummary
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

    public string ProviderLabel
    {
        get;
        init;
    } = string.Empty;

    public string? MaskedIdentifier
    {
        get;
        init;
    }

    public DateTimeOffset AddedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? LastUsedUtc
    {
        get;
        init;
    }

    public bool IsActive
    {
        get;
        init;
    }

    public bool CanRemove
    {
        get;
        init;
    }
}

public sealed class AuthenticationIdentityLinkProposalView
{
    public Guid ProposalId
    {
        get;
        init;
    }

    public string ProviderType
    {
        get;
        init;
    } = string.Empty;

    public string ProviderLabel
    {
        get;
        init;
    } = string.Empty;

    public string? MaskedIdentifier
    {
        get;
        init;
    }

    public bool RequiresExplicitConfirmation
    {
        get;
        init;
    }

    public string ConfirmationMessage
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }
}

public interface IAuthenticationIdentityLinkingService
{
    Task<IReadOnlyList<SignInMethodSummary>> ListSignInMethodsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<Guid> RequestEmailLinkChallengeAsync(
        Guid userId,
        string email,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> VerifyEmailLinkChallengeAsync(
        Guid userId,
        Guid challengeId,
        string code,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken);

    Task CancelLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken);

    Task RemoveSignInMethodAsync(
        Guid userId,
        Guid identityId,
        string actorId,
        CancellationToken cancellationToken);
}

public sealed class AuthenticationIdentityLinkingService(
    IPlatformIdentityService platformIdentity,
    IAuthenticationIdentityRepository identities,
    IAuthenticationIdentityLinkChallengeService challengeService,
    IAuthenticationIdentityLinkProposalService proposalService,
    ISignInMethodRemovalPolicyService removalPolicy,
    IAuditService auditService) : IAuthenticationIdentityLinkingService
{
    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IAuthenticationIdentityRepository _identities =
        identities ?? throw new ArgumentNullException(nameof(identities));

    private readonly IAuthenticationIdentityLinkChallengeService _challengeService =
        challengeService ?? throw new ArgumentNullException(nameof(challengeService));

    private readonly IAuthenticationIdentityLinkProposalService _proposalService =
        proposalService ?? throw new ArgumentNullException(nameof(proposalService));

    private readonly ISignInMethodRemovalPolicyService _removalPolicy =
        removalPolicy ?? throw new ArgumentNullException(nameof(removalPolicy));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<IReadOnlyList<SignInMethodSummary>> ListSignInMethodsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AuthenticationIdentityRecord> rows =
            await _platformIdentity.GetIdentitiesForUserAsync(userId, cancellationToken).ConfigureAwait(false);

        List<SignInMethodSummary> summaries = new();

        foreach (AuthenticationIdentityRecord row in rows)
        {
            SignInMethodRemovalEvaluation removal =
                row.IsActive
                    ? await _removalPolicy.EvaluateAsync(userId, row, cancellationToken).ConfigureAwait(false)
                    : new SignInMethodRemovalEvaluation { Allowed = false };

            summaries.Add(
                new SignInMethodSummary
                {
                    IdentityId = row.Id,
                    ProviderType = row.ProviderType.ToString(),
                    ProviderLabel = AuthenticationIdentityLinkingSupport.ResolveProviderLabel(row.ProviderType),
                    MaskedIdentifier = AuthenticationIdentityLinkingSupport.MaskIdentifier(row),
                    AddedUtc = row.CreatedUtc,
                    LastUsedUtc = row.LastAuthenticatedUtc,
                    IsActive = row.IsActive,
                    CanRemove = row.IsActive && removal.Allowed
                });
        }

        return summaries;
    }

    public Task<Guid> RequestEmailLinkChallengeAsync(
        Guid userId,
        string email,
        string actorId,
        CancellationToken cancellationToken) =>
        _challengeService.RequestEmailLinkChallengeAsync(userId, email, actorId, cancellationToken);

    public Task<AuthenticationIdentityLinkProposalView> VerifyEmailLinkChallengeAsync(
        Guid userId,
        Guid challengeId,
        string code,
        string actorId,
        CancellationToken cancellationToken) =>
        _challengeService.VerifyEmailLinkChallengeAsync(userId, challengeId, code, actorId, cancellationToken);

    public Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken) =>
        _proposalService.CreateExternalLinkProposalAsync(userId, verifiedIdentity, actorId, cancellationToken);

    public Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken) =>
        _proposalService.ConfirmLinkProposalAsync(userId, proposalId, actorId, cancellationToken);

    public Task CancelLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken) =>
        _proposalService.CancelLinkProposalAsync(userId, proposalId, actorId, cancellationToken);

    public async Task RemoveSignInMethodAsync(
        Guid userId,
        Guid identityId,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityRecord? identity =
            await _identities.GetByIdAsync(identityId, cancellationToken).ConfigureAwait(false);

        if (identity is null || identity.UserId != userId)
        {
            throw new ArgumentException("Sign-in method was not found.");
        }

        SignInMethodRemovalEvaluation removal =
            await _removalPolicy.EvaluateAsync(userId, identity, cancellationToken).ConfigureAwait(false);

        if (!removal.Allowed)
        {
            throw new SignInMethodRemovalBlockedException(
                removal.CustomerMessage ?? "This sign-in method cannot be removed.");
        }

        await _platformIdentity.DisableIdentityAsync(identityId, actorId, cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityRemovalRequested,
                actorId,
                new { identityId, providerType = identity.ProviderType.ToString() },
                cancellationToken)
            .ConfigureAwait(false);
    }
}
