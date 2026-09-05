using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Governance;

public sealed partial class RiskExceptionService
{
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

        await EnsureWaiverAllowedForFindingWithInspectLookupAsync(
            scope,
            request.FindingId.Trim(),
            cancellationToken);

        IReadOnlyList<RiskExceptionRecord> expired =
            await repository.MarkExpiredAsync(scope.TenantId, now, cancellationToken);

        await AuditExpiredAsync(expired, cancellationToken);

        RiskExceptionRecord? existingActive = await FindActiveWaiverForFindingAsync(
            scope,
            request.FindingId.Trim(),
            now,
            cancellationToken);

        if (existingActive is not null)
        {
            throw new ConflictException("An active waiver already exists for this finding.");
        }

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
            EvidenceRef = request.EvidenceRef!.Trim(),
            ExpiresAtUtc = request.ExpiresAtUtc,
            Status = RiskExceptionStatus.Active,
            CreatedAtUtc = now,
            CreatedByUserId = createdByUserId.Trim(),
        };

        await repository.CreateAsync(record, cancellationToken);

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

        RiskExceptionRecord? existing = await repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);

        if (existing is null)
            throw new InvalidOperationException("Risk exception was not found.");

        if (existing.Status == RiskExceptionStatus.Revoked)
        {
            throw new ConflictException("Revoked risk exceptions cannot be renewed.");
        }

        IReadOnlyList<RiskExceptionRecord> expired =
            await repository.MarkExpiredAsync(tenantId, now, cancellationToken);

        await AuditExpiredAsync(expired, cancellationToken);

        ScopeContext scope = BuildScopeFromRiskException(existing);

        RiskExceptionRecord? siblingActive = await FindActiveWaiverForFindingAsync(
            scope,
            existing.FindingId,
            now,
            cancellationToken);

        if (siblingActive is not null && siblingActive.RiskExceptionId != riskExceptionId)
        {
            throw new ConflictException("An active waiver already exists for this finding.");
        }

        await EnsureWaiverAllowedForFindingWithInspectLookupAsync(
            scope,
            existing.FindingId,
            cancellationToken);

        string? rationale = request.Rationale?.Trim();
        string? evidenceRef = request.EvidenceRef?.Trim();

        if (IsIdenticalRenewal(existing, request.ExpiresAtUtc, rationale, evidenceRef))
            return existing;

        await repository.RenewAsync(
            tenantId,
            riskExceptionId,
            request.ExpiresAtUtc,
            renewedByUserId.Trim(),
            rationale,
            evidenceRef,
            cancellationToken);

        RiskExceptionRecord? record = await repository.GetByIdAsync(tenantId, riskExceptionId, cancellationToken);

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

    private static bool IsIdenticalRenewal(
        RiskExceptionRecord existing,
        DateTimeOffset expiresAtUtc,
        string? rationale,
        string? evidenceRef)
    {
        if (existing.Status != RiskExceptionStatus.Active)
            return false;

        if (existing.ExpiresAtUtc != expiresAtUtc)
            return false;

        if (rationale is not null && !string.Equals(existing.Rationale, rationale, StringComparison.Ordinal))
            return false;

        if (evidenceRef is not null && !string.Equals(existing.EvidenceRef, evidenceRef, StringComparison.Ordinal))
            return false;

        return true;
    }
}
