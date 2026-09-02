namespace ArchLucid.Application.Identity;

/// <summary>
///     Emits audit events for authentication identity link proposal lifecycle transitions.
/// </summary>
public interface IAuthenticationIdentityLinkProposalAuditNotifier
{
    Task LogProposedAsync(
        string actorId,
        Guid proposalId,
        string providerType,
        bool requiresExplicitConfirmation,
        CancellationToken cancellationToken);

    Task LogConfirmedAsync(
        string actorId,
        Guid proposalId,
        Guid identityId,
        string providerType,
        CancellationToken cancellationToken);

    Task LogCancelledAsync(string actorId, Guid proposalId, CancellationToken cancellationToken);

    Task LogFailedAsync(string actorId, string reason, string providerType, CancellationToken cancellationToken);
}
