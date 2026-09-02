using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Identity;

/// <inheritdoc cref="IAuthenticationIdentityLinkProposalAuditNotifier" />
public sealed class AuthenticationIdentityLinkProposalAuditNotifier(IAuditService auditService)
    : IAuthenticationIdentityLinkProposalAuditNotifier
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public Task LogProposedAsync(
        string actorId,
        Guid proposalId,
        string providerType,
        bool requiresExplicitConfirmation,
        CancellationToken cancellationToken) =>
        AuthAuditEmitter.LogIdentityEventAsync(
            _auditService,
            AuditEventTypes.AuthenticationIdentityLinkProposed,
            actorId,
            new { proposalId, providerType, requiresExplicitConfirmation },
            cancellationToken);

    public Task LogConfirmedAsync(
        string actorId,
        Guid proposalId,
        Guid identityId,
        string providerType,
        CancellationToken cancellationToken) =>
        AuthAuditEmitter.LogIdentityEventAsync(
            _auditService,
            AuditEventTypes.AuthenticationIdentityLinkConfirmed,
            actorId,
            new { proposalId, identityId, providerType },
            cancellationToken);

    public Task LogCancelledAsync(string actorId, Guid proposalId, CancellationToken cancellationToken) =>
        AuthAuditEmitter.LogIdentityEventAsync(
            _auditService,
            AuditEventTypes.AuthenticationIdentityLinkCancelled,
            actorId,
            new { proposalId },
            cancellationToken);

    public Task LogFailedAsync(string actorId, string reason, string providerType, CancellationToken cancellationToken) =>
        AuthAuditEmitter.LogIdentityEventAsync(
            _auditService,
            AuditEventTypes.AuthenticationIdentityLinkFailed,
            actorId,
            new { reason, providerType },
            cancellationToken);
}
