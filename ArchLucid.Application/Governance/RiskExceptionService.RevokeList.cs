using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Governance;

public sealed partial class RiskExceptionService
{
    public Task<RiskExceptionRecord?> GetByIdAsync(
        Guid tenantId,
        Guid riskExceptionId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (riskExceptionId == Guid.Empty)
            throw new ArgumentException("Risk exception id is required.", nameof(riskExceptionId));

        return repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);
    }

    public async Task RevokeAsync(
        Guid tenantId,
        Guid riskExceptionId,
        string revokedByUserId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (riskExceptionId == Guid.Empty)
            throw new ArgumentException("Risk exception id is required.", nameof(riskExceptionId));

        if (string.IsNullOrWhiteSpace(revokedByUserId))
            throw new ArgumentException("Revoked-by user id is required.", nameof(revokedByUserId));

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();

        RiskExceptionRecord? existing = await repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);

        if (existing is null)
            throw new InvalidOperationException("Risk exception was not found.");

        IReadOnlyList<RiskExceptionRecord> expired =
            await repository.MarkExpiredAsync(tenantId, now, cancellationToken);

        await AuditExpiredAsync(expired, cancellationToken);

        existing = await repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);

        if (existing is null)
            throw new InvalidOperationException("Risk exception was not found.");

        if (existing.Status == RiskExceptionStatus.Revoked)
            return;

        if (existing.Status != RiskExceptionStatus.Active)
        {
            throw new ConflictException("Only active risk exceptions can be revoked.");
        }

        await repository.RevokeAsync(
            tenantId,
            riskExceptionId,
            revokedByUserId.Trim(),
            now,
            cancellationToken);

        AuditEvent revokedAudit = new()
        {
            EventType = AuditEventTypes.RiskExceptionRevoked,
            ActorUserId = revokedByUserId.Trim(),
            ActorUserName = revokedByUserId.Trim(),
            TenantId = tenantId,
            DataJson = JsonSerializer.Serialize(new { riskExceptionId }, AuditJsonSerializationOptions.Instance),
        };

        await LogRequiredAsync(revokedAudit, $"RiskExceptionRevoked:{riskExceptionId:N}", cancellationToken);
    }

    public async Task<IReadOnlyList<RiskExceptionRecord>> ListActiveAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        IReadOnlyList<RiskExceptionRecord> expired =
            await repository.MarkExpiredAsync(tenantId, TimeProvider.System.UtcNowDateTime(), cancellationToken);

        await AuditExpiredAsync(expired, cancellationToken);

        return await repository.ListActiveForTenantAsync(tenantId, projectId, cancellationToken);
    }

    public async Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        return await repository.ListRetiredSinceUtcAsync(tenantId, projectId, sinceUtc, cancellationToken);
    }

    private async Task AuditExpiredAsync(
        IReadOnlyList<RiskExceptionRecord>? expired,
        CancellationToken cancellationToken)
    {
        if (expired is null || expired.Count == 0)
            return;

        foreach (RiskExceptionRecord record in expired)
        {
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.RiskExceptionExpired,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    TenantId = record.TenantId,
                    WorkspaceId = record.WorkspaceId,
                    ProjectId = record.ProjectId,
                    RunId = record.RunId,
                    DataJson = JsonSerializer.Serialize(
                        new { record.RiskExceptionId, record.FindingId, record.ExpiresAtUtc },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);
        }
    }

    private Task LogRequiredAsync(AuditEvent auditEvent, string operationLabel, CancellationToken cancellationToken)
    {
        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => auditService.LogAsync(auditEvent, ct),
            logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: auditEvent.EventType);
    }
}
