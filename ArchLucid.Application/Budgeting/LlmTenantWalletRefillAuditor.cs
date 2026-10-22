using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Application.Budgeting;

internal sealed class LlmTenantWalletRefillAuditor(IAuditService auditService, TimeProvider timeProvider)
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    internal async Task LogRefillSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        CancellationToken cancellationToken)
    {
        string dataJson = JsonSerializer.Serialize(new { paymentIntentId, amountUsd });

        await LogRefillAuditAsync(
                new AuditEvent
                {
                    TenantId = tenantId,
                    EventType = AuditEventTypes.LlmWalletRefillSucceeded,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    ExplicitActor = true,
                    DataJson = dataJson,
                    OccurredUtc = _timeProvider.GetUtcNow().UtcDateTime,
                },
                cancellationToken)
            .ConfigureAwait(false);
    }

    internal async Task LogRefillFailedAsync(
        Guid tenantId,
        string? declineCode,
        string? errorMessage,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordLlmWalletRefillFailure(declineCode);

        string dataJson = JsonSerializer.Serialize(new { declineCode, errorMessage });

        await LogRefillAuditAsync(
                new AuditEvent
                {
                    TenantId = tenantId,
                    EventType = AuditEventTypes.LlmWalletRefillFailed,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    ExplicitActor = true,
                    DataJson = dataJson,
                    OccurredUtc = _timeProvider.GetUtcNow().UtcDateTime,
                },
                cancellationToken)
            .ConfigureAwait(false);
    }

    [InformationalAudit]
    private Task LogRefillAuditAsync(AuditEvent auditEvent, CancellationToken cancellationToken) =>
        _auditService.LogAsync(auditEvent, cancellationToken);
}
