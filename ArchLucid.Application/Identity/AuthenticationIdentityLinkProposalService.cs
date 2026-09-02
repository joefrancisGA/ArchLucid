using ArchLucid.Application.Identity.LinkProposal;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public interface IAuthenticationIdentityLinkProposalService
{
    Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> CreateProposalAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string? displayEmail,
        bool emailVerified,
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

    Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string actorId,
        CancellationToken cancellationToken);
}

/// <inheritdoc cref="IAuthenticationIdentityLinkProposalService" />
public sealed class AuthenticationIdentityLinkProposalService(
    IAuthenticationIdentityLinkProposalCreateStage createStage,
    IAuthenticationIdentityLinkProposalConfirmStage confirmStage,
    IAuthenticationIdentityLinkProposalCancelStage cancelStage,
    IExternalKeyEligibilityChecker externalKeyEligibilityChecker) : IAuthenticationIdentityLinkProposalService
{
    private readonly IAuthenticationIdentityLinkProposalCreateStage _createStage =
        createStage ?? throw new ArgumentNullException(nameof(createStage));

    private readonly IAuthenticationIdentityLinkProposalConfirmStage _confirmStage =
        confirmStage ?? throw new ArgumentNullException(nameof(confirmStage));

    private readonly IAuthenticationIdentityLinkProposalCancelStage _cancelStage =
        cancelStage ?? throw new ArgumentNullException(nameof(cancelStage));

    private readonly IExternalKeyEligibilityChecker _externalKeyEligibilityChecker =
        externalKeyEligibilityChecker ?? throw new ArgumentNullException(nameof(externalKeyEligibilityChecker));

    public Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken) =>
        _createStage.CreateExternalLinkProposalAsync(userId, verifiedIdentity, actorId, cancellationToken);

    public Task<AuthenticationIdentityLinkProposalView> CreateProposalAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string? displayEmail,
        bool emailVerified,
        string actorId,
        CancellationToken cancellationToken) =>
        _createStage.CreateProposalAsync(
            userId,
            externalKey,
            normalizedEmail,
            displayEmail,
            emailVerified,
            actorId,
            cancellationToken);

    public Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken) =>
        _confirmStage.ConfirmLinkProposalAsync(userId, proposalId, actorId, cancellationToken);

    public Task CancelLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken) =>
        _cancelStage.CancelLinkProposalAsync(userId, proposalId, actorId, cancellationToken);

    public Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string actorId,
        CancellationToken cancellationToken) =>
        _externalKeyEligibilityChecker.EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
            userId,
            externalKey,
            normalizedEmail,
            actorId,
            cancellationToken);
}
