using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityExceptions;

public sealed class OperationalSecurityExceptionService(
    IOperationalSecurityExceptionRepository exceptionRepository,
    IOperationalSecurityFindingRepository findingRepository,
    IAuditService auditService,
    ILogger<OperationalSecurityExceptionService> logger) : IOperationalSecurityExceptionService
{
    public async Task<OperationalSecurityExceptionCreateResult> CreateAsync(
        ScopeContext scope,
        OperationalSecurityExceptionCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        if (!OperationalSecurityExceptionGuard.TryValidateCreateRequest(request, utcNow, out string? validationError))
        {
            return new OperationalSecurityExceptionCreateResult
            {
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        if (request.FindingId is Guid findingId && findingId != Guid.Empty)
        {
            OperationalSecurityFindingRecord? finding =
                await findingRepository.TryGetByIdAsync(scope.TenantId, findingId, cancellationToken);

            if (finding is null)
            {
                return new OperationalSecurityExceptionCreateResult
                {
                    Succeeded = false,
                    ErrorMessage = "Operational security finding was not found in current tenant scope.",
                };
            }
        }

        Guid exceptionId = Guid.NewGuid();
        byte[] payloadHash = OperationalSecurityExceptionGuard.ComputePayloadHash(request);

        OperationalSecurityExceptionRecord record = new()
        {
            ExceptionId = exceptionId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FindingId = request.FindingId,
            PatternId = request.PatternId,
            CloudResourceId = request.CloudResourceId,
            OwnerActorKeysJson = JsonSerializer.Serialize(
                request.OwnerActorKeys.Select(key => key.Trim()).ToArray()),
            Rationale = request.Rationale.Trim(),
            ResidualRisk = request.ResidualRisk?.Trim(),
            CompensatingControls = request.CompensatingControls?.Trim(),
            EvidenceReference = request.EvidenceReference?.Trim(),
            ExpirationUtc = request.ExpirationUtc,
            Status = OperationalSecurityExceptionStatus.Active,
            RequestedByActorKey = request.RequestedByActorKey.Trim(),
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
            PayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await exceptionRepository.InsertAsync(record, cancellationToken);

        if (request.FindingId is Guid linkedFindingId && linkedFindingId != Guid.Empty)
        {
            await ApplyFindingExceptionStatusAsync(scope.TenantId, linkedFindingId, utcNow, cancellationToken);
        }

        await LogAuditAsync(
            scope,
            request.ApprovedByActorKey.Trim(),
            AuditEventTypes.OperationalSecurityExceptionCreated,
            exceptionId,
            request,
            cancellationToken);

        return new OperationalSecurityExceptionCreateResult
        {
            Succeeded = true,
            ExceptionId = exceptionId,
        };
    }

    public async Task<OperationalSecurityExceptionRevokeResult> RevokeAsync(
        ScopeContext scope,
        Guid exceptionId,
        string revokedByActorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (exceptionId == Guid.Empty)
        {
            return new OperationalSecurityExceptionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "ExceptionId is required.",
            };
        }

        if (string.IsNullOrWhiteSpace(revokedByActorKey))
        {
            return new OperationalSecurityExceptionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "RevokedByActorKey is required.",
            };
        }

        OperationalSecurityExceptionRecord? existing =
            await exceptionRepository.TryGetByIdAsync(scope.TenantId, exceptionId, cancellationToken);

        if (existing is null)
        {
            return new OperationalSecurityExceptionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "Operational security exception was not found.",
            };
        }

        if (existing.Status != OperationalSecurityExceptionStatus.Active)
        {
            return new OperationalSecurityExceptionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "Only active exceptions can be revoked.",
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        await exceptionRepository.RevokeAsync(scope.TenantId, exceptionId, revokedByActorKey.Trim(), utcNow, cancellationToken);

        if (existing.FindingId is Guid findingId)
        {
            await ReopenFindingAsync(scope.TenantId, findingId, utcNow, summary: "Exception revoked.", cancellationToken);
        }

        await LogAuditAsync(
            scope,
            revokedByActorKey.Trim(),
            AuditEventTypes.OperationalSecurityExceptionRevoked,
            exceptionId,
            existing,
            cancellationToken);

        return new OperationalSecurityExceptionRevokeResult { Succeeded = true };
    }

    public async Task<OperationalSecurityExceptionExpirySweepResult> SweepExpiredAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        IReadOnlyList<OperationalSecurityExceptionRecord> expiredRecords =
            await exceptionRepository.MarkExpiredAsync(scope.TenantId, utcNow, cancellationToken);

        int findingsReopened = 0;
        int observationsCreated = 0;

        foreach (OperationalSecurityExceptionRecord expired in expiredRecords)
        {
            if (expired.ExpiryProcessedUtc.HasValue)
                continue;

            if (expired.FindingId is Guid findingId)
            {
                bool reopened = await ReopenFindingWithExpiryObservationAsync(
                    scope.TenantId,
                    findingId,
                    expired.ExceptionId,
                    utcNow,
                    cancellationToken);

                if (reopened)
                {
                    findingsReopened++;
                    observationsCreated++;
                }
            }

            await exceptionRepository.MarkExpiryProcessedAsync(
                scope.TenantId,
                expired.ExceptionId,
                utcNow,
                cancellationToken);
        }

        if (expiredRecords.Count > 0)
        {
            logger.LogInformation(
                "Operational security exception expiry sweep processed {ExpiredCount} exceptions for tenant {TenantId}.",
                expiredRecords.Count,
                scope.TenantId);
        }

        return new OperationalSecurityExceptionExpirySweepResult
        {
            ExpiredCount = expiredRecords.Count,
            FindingsReopenedCount = findingsReopened,
            ObservationsCreatedCount = observationsCreated,
        };
    }

    private async Task ApplyFindingExceptionStatusAsync(
        Guid tenantId,
        Guid findingId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        OperationalSecurityFindingRecord? finding =
            await findingRepository.TryGetByIdAsync(tenantId, findingId, cancellationToken);

        if (finding is null || finding.Status == OperationalSecurityFindingStatus.Exception)
            return;

        OperationalSecurityFindingRecord updated = CloneFinding(
            finding,
            status: OperationalSecurityFindingStatus.Exception,
            lastObservedUtc: utcNow,
            updatedUtc: utcNow);

        await findingRepository.UpdateAsync(updated, [], observation: null, cancellationToken);
    }

    private async Task<bool> ReopenFindingWithExpiryObservationAsync(
        Guid tenantId,
        Guid findingId,
        Guid exceptionId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        OperationalSecurityFindingRecord? finding =
            await findingRepository.TryGetByIdAsync(tenantId, findingId, cancellationToken);

        if (finding is null)
            return false;

        IReadOnlyList<OperationalSecurityFindingObservationRecord> observations =
            await findingRepository.ListObservationsByFindingAsync(tenantId, findingId, cancellationToken);

        if (observations.Any(observation =>
                string.Equals(
                    observation.SourceSystem,
                    OperationalSecurityExceptionConstants.ExceptionExpirySourceSystem,
                    StringComparison.Ordinal)
                && OperationalSecurityFindingGuard.PayloadHashesEqual(
                    observation.PayloadHashSha256,
                    OperationalSecurityExceptionGuard.ComputeExpiryObservationHash(exceptionId, findingId))))
        {
            return false;
        }

        OperationalSecurityFindingStatus reopenedStatus =
            finding.Status == OperationalSecurityFindingStatus.Closed
                ? OperationalSecurityFindingStatus.Recurred
                : OperationalSecurityFindingStatus.Open;

        byte[] observationHash =
            OperationalSecurityExceptionGuard.ComputeExpiryObservationHash(exceptionId, findingId);

        OperationalSecurityFindingObservationRecord observation = new()
        {
            ObservationId = Guid.NewGuid(),
            FindingId = findingId,
            TenantId = tenantId,
            ObservedUtc = utcNow,
            Status = reopenedStatus,
            Severity = finding.Severity,
            RiskScore = finding.RiskScore,
            Summary = "Operational security exception expired; finding visibility reopened.",
            PayloadHashSha256 = observationHash,
            SourceSystem = OperationalSecurityExceptionConstants.ExceptionExpirySourceSystem,
        };

        OperationalSecurityFindingRecord updated = CloneFinding(
            finding,
            status: reopenedStatus,
            lastObservedUtc: utcNow,
            updatedUtc: utcNow);

        await findingRepository.UpdateAsync(updated, [], observation, cancellationToken);
        return true;
    }

    private async Task ReopenFindingAsync(
        Guid tenantId,
        Guid findingId,
        DateTime utcNow,
        string summary,
        CancellationToken cancellationToken)
    {
        OperationalSecurityFindingRecord? finding =
            await findingRepository.TryGetByIdAsync(tenantId, findingId, cancellationToken);

        if (finding is null || finding.Status != OperationalSecurityFindingStatus.Exception)
            return;

        OperationalSecurityFindingStatus reopenedStatus = OperationalSecurityFindingStatus.Open;

        OperationalSecurityFindingObservationRecord observation = new()
        {
            ObservationId = Guid.NewGuid(),
            FindingId = findingId,
            TenantId = tenantId,
            ObservedUtc = utcNow,
            Status = reopenedStatus,
            Severity = finding.Severity,
            RiskScore = finding.RiskScore,
            Summary = summary,
            PayloadHashSha256 = SHA256.HashData(Encoding.UTF8.GetBytes($"{findingId:N}:{summary}:{utcNow:O}")),
            SourceSystem = OperationalSecurityExceptionConstants.ExceptionExpirySourceSystem,
        };

        OperationalSecurityFindingRecord updated = CloneFinding(
            finding,
            status: reopenedStatus,
            lastObservedUtc: utcNow,
            updatedUtc: utcNow);

        await findingRepository.UpdateAsync(updated, [], observation, cancellationToken);
    }

    private static OperationalSecurityFindingRecord CloneFinding(
        OperationalSecurityFindingRecord source,
        OperationalSecurityFindingStatus? status = null,
        DateTime? lastObservedUtc = null,
        DateTime? updatedUtc = null) =>
        new()
        {
            FindingId = source.FindingId,
            TenantId = source.TenantId,
            WorkspaceId = source.WorkspaceId,
            ProjectId = source.ProjectId,
            Provider = source.Provider,
            SourceSystem = source.SourceSystem,
            SourceFindingId = source.SourceFindingId,
            CloudResourceId = source.CloudResourceId,
            ExternalResourceId = source.ExternalResourceId,
            ResourceType = source.ResourceType,
            SubscriptionOrAccountId = source.SubscriptionOrAccountId,
            ControlId = source.ControlId,
            ControlFramework = source.ControlFramework,
            Title = source.Title,
            Description = source.Description,
            Severity = source.Severity,
            RiskScore = source.RiskScore,
            Exploitability = source.Exploitability,
            Exposure = source.Exposure,
            BusinessCriticality = source.BusinessCriticality,
            BlastRadius = source.BlastRadius,
            FirstObservedUtc = source.FirstObservedUtc,
            LastObservedUtc = lastObservedUtc ?? source.LastObservedUtc,
            Status = status ?? source.Status,
            RawEvidenceReference = source.RawEvidenceReference,
            AssessmentId = source.AssessmentId,
            InventoryDiffId = source.InventoryDiffId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            PayloadHashSha256 = source.PayloadHashSha256,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
        };

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorId,
        string eventType,
        Guid exceptionId,
        object payload,
        CancellationToken cancellationToken)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actorId,
                ActorUserName = actorId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new { exceptionId, payload },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }
}
