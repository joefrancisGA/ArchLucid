using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed partial class PlatformAuthRecoveryService
{
    public async Task<bool> RevokeGrantAsync(Guid grantId, string operatorActorId, CancellationToken cancellationToken)
    {
        DateTimeOffset now = _timeProvider.GetUtcNow();
        bool revoked = await _grants.RevokeAsync(grantId, operatorActorId, now, cancellationToken).ConfigureAwait(false);

        if (!revoked)
        {
            return false;
        }

        PlatformTenantAuthRecoveryGrantRecord? grant =
            await _grants.GetByIdAsync(grantId, cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.PlatformTenantAuthRecoveryRevoked,
                operatorActorId,
                new { grantId },
                cancellationToken,
                grant?.TenantId)
            .ConfigureAwait(false);

        return true;
    }

    public async Task<PlatformAuthRecoveryGrantView?> GetGrantAsync(Guid grantId, CancellationToken cancellationToken)
    {
        PlatformTenantAuthRecoveryGrantRecord? grant =
            await _grants.GetByIdAsync(grantId, cancellationToken).ConfigureAwait(false);

        return grant is null ? null : ToView(grant, _timeProvider.GetUtcNow());
    }
}
