using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Governance;

public sealed class RiskExceptionService(IRiskExceptionRepository repository, IAuditService auditService) : IRiskExceptionService
{
    private readonly IRiskExceptionRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    public async Task<RiskExceptionRecord> CreateAsync(
        CreateRiskExceptionRequest request,
        ScopeContext scope,
        string createdByUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(createdByUserId))
            throw new ArgumentException("Created-by user id is required.", nameof(createdByUserId));

        if (string.IsNullOrWhiteSpace(request.FindingId))
            throw new ArgumentException("Finding id is required.", nameof(request));

        if (string.IsNullOrWhiteSpace(request.OwnerUserId))
            throw new ArgumentException("Owner user id is required.", nameof(request));

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        RiskExceptionValidation.Validate(request, now);

        RiskExceptionRecord record = new()
        {
            RiskExceptionId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FindingId = request.FindingId.Trim(),
            RunId = request.RunId,
            ManifestId = request.ManifestId,
            OwnerUserId = request.OwnerUserId.Trim(),
            Rationale = request.Rationale.Trim(),
            EvidenceRef = request.EvidenceRef,
            ExpiresAtUtc = request.ExpiresAtUtc,
            Status = RiskExceptionStatus.Active,
            CreatedAtUtc = now,
            CreatedByUserId = createdByUserId.Trim(),
        };

        await _repository.CreateAsync(record, cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RiskExceptionCreated,
                ActorUserId = createdByUserId.Trim(),
                ActorUserName = createdByUserId.Trim(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = request.RunId,
                DataJson = JsonSerializer.Serialize(
                    new { record.RiskExceptionId, record.FindingId, record.ExpiresAtUtc },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);

        return record;
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

        await _repository.RevokeAsync(
            tenantId,
            riskExceptionId,
            revokedByUserId.Trim(),
            TimeProvider.System.UtcNowDateTime(),
            cancellationToken);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RiskExceptionRevoked,
                ActorUserId = revokedByUserId.Trim(),
                ActorUserName = revokedByUserId.Trim(),
                TenantId = tenantId,
                DataJson = JsonSerializer.Serialize(new { riskExceptionId }, AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }

    public async Task<IReadOnlyList<RiskExceptionRecord>> ListActiveAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        await _repository.MarkExpiredAsync(tenantId, TimeProvider.System.UtcNowDateTime(), cancellationToken);

        return await _repository.ListActiveForTenantAsync(tenantId, projectId, cancellationToken);
    }

    public async Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        return await _repository.ListRetiredSinceUtcAsync(tenantId, projectId, sinceUtc, cancellationToken);
    }
}
