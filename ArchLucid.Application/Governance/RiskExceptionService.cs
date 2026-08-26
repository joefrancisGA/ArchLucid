using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance;

public sealed class RiskExceptionService(
    IRiskExceptionRepository repository,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IAuditService auditService,
    ILogger<RiskExceptionService> logger) : IRiskExceptionService
{
    private readonly IRiskExceptionRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<RiskExceptionService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

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

        AuditEvent createdAudit = new()
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
        };

        await LogRequiredAsync(createdAudit, $"RiskExceptionCreated:{record.RiskExceptionId:N}", cancellationToken);

        return record;
    }

    public Task<RiskExceptionRecord?> GetByIdAsync(
        Guid tenantId,
        Guid riskExceptionId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (riskExceptionId == Guid.Empty)
            throw new ArgumentException("Risk exception id is required.", nameof(riskExceptionId));

        return _repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);
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
            await _repository.MarkExpiredAsync(tenantId, TimeProvider.System.UtcNowDateTime(), cancellationToken);

        await AuditExpiredAsync(expired, cancellationToken);

        return await _repository.ListActiveForTenantAsync(tenantId, projectId, cancellationToken);
    }

    public async Task<RiskExceptionRecord> RenewAsync(
        Guid tenantId,
        Guid riskExceptionId,
        RenewRiskExceptionRequest request,
        string renewedByUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (riskExceptionId == Guid.Empty)
            throw new ArgumentException("Risk exception id is required.", nameof(riskExceptionId));

        if (string.IsNullOrWhiteSpace(renewedByUserId))
            throw new ArgumentException("Renewed-by user id is required.", nameof(renewedByUserId));

        DateTimeOffset now = TimeProvider.System.UtcNowDateTime();
        RiskExceptionValidation.ValidateRenew(request, now);

        RiskExceptionRecord? existing = await _repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);

        if (existing is null)
            throw new InvalidOperationException("Risk exception was not found.");

        await RiskExceptionDispositionGuard.EnsureWaiverAllowedForFindingAsync(
            _findingReviewTrailRepository,
            tenantId,
            existing.FindingId,
            cancellationToken);

        await _repository.RenewAsync(
            tenantId,
            riskExceptionId,
            request.ExpiresAtUtc,
            renewedByUserId.Trim(),
            request.Rationale,
            request.EvidenceRef,
            cancellationToken);

        RiskExceptionRecord? record = await _repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);

        if (record is null)
            throw new InvalidOperationException("Risk exception was not found after renewal.");

        AuditEvent renewedAudit = new()
        {
            EventType = AuditEventTypes.RiskExceptionRenewed,
            ActorUserId = renewedByUserId.Trim(),
            ActorUserName = renewedByUserId.Trim(),
            TenantId = tenantId,
            WorkspaceId = record.WorkspaceId,
            ProjectId = record.ProjectId,
            RunId = record.RunId,
            DataJson = JsonSerializer.Serialize(
                new { riskExceptionId, record.FindingId, record.ExpiresAtUtc },
                AuditJsonSerializationOptions.Instance),
        };

        await LogRequiredAsync(renewedAudit, $"RiskExceptionRenewed:{riskExceptionId:N}", cancellationToken);

        return record;
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

    private async Task AuditExpiredAsync(
        IReadOnlyList<RiskExceptionRecord> expired,
        CancellationToken cancellationToken)
    {
        foreach (RiskExceptionRecord record in expired)

            await _auditService.LogAsync(
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

    private Task LogRequiredAsync(AuditEvent auditEvent, string operationLabel, CancellationToken cancellationToken)
    {
        return DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: auditEvent.EventType);
    }
}
