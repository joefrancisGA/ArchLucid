using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Identity;

public sealed class PlatformRecoveryNotificationService(IAuditService auditService) : IPlatformRecoveryNotificationService
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<bool> TryNotifyTenantRecoveryGrantAsync(
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset expiresUtc,
        IReadOnlyList<string> recoveryAdminEmails,
        CancellationToken cancellationToken)
    {
        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.PlatformTenantAuthRecoveryTenantNotified,
                "platform",
                new
                {
                    normalizedDomain,
                    expiresUtc,
                    recipientCount = recoveryAdminEmails.Count
                },
                cancellationToken,
                tenantId)
            .ConfigureAwait(false);

        return true;
    }
}
