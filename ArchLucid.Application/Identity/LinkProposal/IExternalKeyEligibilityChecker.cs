using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

public interface IExternalKeyEligibilityChecker
{
    Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string actorId,
        CancellationToken cancellationToken);

    Task EnsureExternalKeyAvailableAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string actorId,
        CancellationToken cancellationToken);
}
