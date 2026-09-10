using System.Text.Json;

using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;

public sealed class SecurityAssetAssertionService(
    ISecurityAssetAssertionRepository assertionRepository,
    IOperationalSecurityFindingRepository findingRepository,
    IAuditService auditService,
    ILogger<SecurityAssetAssertionService> logger) : ISecurityAssetAssertionService
{
    public async Task<SecurityAssetAssertionCreateResult> CreateAsync(
        ScopeContext scope,
        SecurityAssetAssertionCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        if (!SecurityAssetAssertionGuard.TryValidateCreateRequest(request, utcNow, out string? validationError))
        {
            return new SecurityAssetAssertionCreateResult
            {
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        SecurityAssetAssertionRecord? existingActive =
            await assertionRepository.TryGetActiveByCloudResourceIdAsync(
                scope.TenantId,
                request.CloudResourceId,
                utcNow,
                cancellationToken);

        if (existingActive is not null)
        {
            return new SecurityAssetAssertionCreateResult
            {
                Succeeded = false,
                ErrorMessage = "An active asset assertion already exists for this cloud resource.",
            };
        }

        Guid assertionId = Guid.NewGuid();
        byte[] payloadHash = SecurityAssetAssertionGuard.ComputePayloadHash(request);

        SecurityAssetAssertionRecord record = new()
        {
            AssertionId = assertionId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CloudResourceId = request.CloudResourceId,
            DataSensitivity = request.DataSensitivity,
            RegulatoryClass = request.RegulatoryClass,
            DeploymentEnvironment = request.DeploymentEnvironment,
            BusinessCriticality = request.BusinessCriticality,
            IsRevenueImpact = request.IsRevenueImpact,
            IsPatientImpact = request.IsPatientImpact,
            Rationale = request.Rationale.Trim(),
            EvidenceReference = request.EvidenceReference?.Trim(),
            ExpirationUtc = request.ExpirationUtc,
            Status = SecurityAssetAssertionStatus.Active,
            RequestedByActorKey = request.RequestedByActorKey.Trim(),
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
            PayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

        await assertionRepository.InsertAsync(record, cancellationToken);

        await LogAuditAsync(
            scope,
            request.ApprovedByActorKey.Trim(),
            AuditEventTypes.SecurityAssetAssertionCreated,
            assertionId,
            request,
            cancellationToken);

        return new SecurityAssetAssertionCreateResult
        {
            Succeeded = true,
            AssertionId = assertionId,
        };
    }

    public async Task<SecurityAssetAssertionRenewResult> RenewAsync(
        ScopeContext scope,
        Guid assertionId,
        SecurityAssetAssertionRenewRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        if (assertionId == Guid.Empty)
        {
            return new SecurityAssetAssertionRenewResult
            {
                Succeeded = false,
                ErrorMessage = "AssertionId is required.",
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        if (!SecurityAssetAssertionGuard.TryValidateRenewRequest(request, utcNow, out string? validationError))
        {
            return new SecurityAssetAssertionRenewResult
            {
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        SecurityAssetAssertionRecord? existing =
            await assertionRepository.TryGetByIdAsync(scope.TenantId, assertionId, cancellationToken);

        if (existing is null)
        {
            return new SecurityAssetAssertionRenewResult
            {
                Succeeded = false,
                ErrorMessage = "Security asset assertion was not found.",
            };
        }

        if (existing.Status != SecurityAssetAssertionStatus.Active)
        {
            return new SecurityAssetAssertionRenewResult
            {
                Succeeded = false,
                ErrorMessage = "Only active assertions can be renewed.",
            };
        }

        SecurityAssetAssertionRecord renewed = new()
        {
            AssertionId = existing.AssertionId,
            TenantId = existing.TenantId,
            WorkspaceId = existing.WorkspaceId,
            ProjectId = existing.ProjectId,
            CloudResourceId = existing.CloudResourceId,
            DataSensitivity = existing.DataSensitivity,
            RegulatoryClass = existing.RegulatoryClass,
            DeploymentEnvironment = existing.DeploymentEnvironment,
            BusinessCriticality = existing.BusinessCriticality,
            IsRevenueImpact = existing.IsRevenueImpact,
            IsPatientImpact = existing.IsPatientImpact,
            Rationale = existing.Rationale,
            EvidenceReference = existing.EvidenceReference,
            ExpirationUtc = request.ExpirationUtc,
            Status = SecurityAssetAssertionStatus.Active,
            RequestedByActorKey = request.RenewedByActorKey.Trim(),
            ApprovedByActorKey = request.ApprovedByActorKey.Trim(),
            PayloadHashSha256 = SecurityAssetAssertionGuard.ComputeRenewalPayloadHash(
                existing,
                request.ExpirationUtc,
                request.RenewedByActorKey,
                request.ApprovedByActorKey),
            ExpiryProcessedUtc = null,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = utcNow,
        };

        await assertionRepository.UpdateRenewalAsync(renewed, cancellationToken);

        await LogAuditAsync(
            scope,
            request.ApprovedByActorKey.Trim(),
            AuditEventTypes.SecurityAssetAssertionRenewed,
            assertionId,
            request,
            cancellationToken);

        return new SecurityAssetAssertionRenewResult { Succeeded = true };
    }

    public async Task<SecurityAssetAssertionRevokeResult> RevokeAsync(
        ScopeContext scope,
        Guid assertionId,
        string revokedByActorKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (assertionId == Guid.Empty)
        {
            return new SecurityAssetAssertionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "AssertionId is required.",
            };
        }

        if (string.IsNullOrWhiteSpace(revokedByActorKey))
        {
            return new SecurityAssetAssertionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "RevokedByActorKey is required.",
            };
        }

        SecurityAssetAssertionRecord? existing =
            await assertionRepository.TryGetByIdAsync(scope.TenantId, assertionId, cancellationToken);

        if (existing is null)
        {
            return new SecurityAssetAssertionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "Security asset assertion was not found.",
            };
        }

        if (existing.Status != SecurityAssetAssertionStatus.Active)
        {
            return new SecurityAssetAssertionRevokeResult
            {
                Succeeded = false,
                ErrorMessage = "Only active assertions can be revoked.",
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        await assertionRepository.RevokeAsync(
            scope.TenantId,
            assertionId,
            revokedByActorKey.Trim(),
            utcNow,
            cancellationToken);

        await LogAuditAsync(
            scope,
            revokedByActorKey.Trim(),
            AuditEventTypes.SecurityAssetAssertionRevoked,
            assertionId,
            existing,
            cancellationToken);

        return new SecurityAssetAssertionRevokeResult { Succeeded = true };
    }

    public async Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        await SweepExpiredAsync(scope, cancellationToken);

        return await assertionRepository.ListByTenantAsync(scope.TenantId, cancellationToken);
    }

    public async Task<SecurityAssetAssertionExpirySweepResult> SweepExpiredAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        IReadOnlyList<SecurityAssetAssertionRecord> expiredRecords =
            await assertionRepository.MarkExpiredAsync(scope.TenantId, utcNow, cancellationToken);

        int observationsCreated = 0;

        foreach (SecurityAssetAssertionRecord expired in expiredRecords)
        {
            if (expired.ExpiryProcessedUtc.HasValue)
            {
                continue;
            }

            int created = await CreateExpiryObservationsAsync(
                scope.TenantId,
                expired,
                utcNow,
                cancellationToken);

            observationsCreated += created;

            await assertionRepository.MarkExpiryProcessedAsync(
                scope.TenantId,
                expired.AssertionId,
                utcNow,
                cancellationToken);

            await LogAuditAsync(
                scope,
                SecureNowArchitectConstants.SystemActorId,
                AuditEventTypes.SecurityAssetAssertionExpired,
                expired.AssertionId,
                expired,
                cancellationToken);
        }

        if (expiredRecords.Count > 0)
        {
            logger.LogInformation(
                "Security asset assertion expiry sweep processed {ExpiredCount} assertions for tenant {TenantId}.",
                expiredRecords.Count,
                scope.TenantId);
        }

        return new SecurityAssetAssertionExpirySweepResult
        {
            ExpiredCount = expiredRecords.Count,
            ObservationsCreatedCount = observationsCreated,
        };
    }

    private async Task<int> CreateExpiryObservationsAsync(
        Guid tenantId,
        SecurityAssetAssertionRecord expired,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        (IReadOnlyList<OperationalSecurityFindingRecord> findings, _) =
            await findingRepository.ListByCloudResourceIdPagedAsync(
                tenantId,
                expired.CloudResourceId,
                page: 1,
                pageSize: 100,
                cancellationToken);

        if (findings.Count == 0)
        {
            return 0;
        }

        int created = 0;

        foreach (OperationalSecurityFindingRecord finding in findings)
        {
            IReadOnlyList<OperationalSecurityFindingObservationRecord> observations =
                await findingRepository.ListObservationsByFindingAsync(tenantId, finding.FindingId, cancellationToken);

            if (observations.Any(observation =>
                    string.Equals(
                        observation.SourceSystem,
                        SecurityAssetAssertionConstants.AssertionExpirySourceSystem,
                        StringComparison.Ordinal)
                    && OperationalSecurityFindingGuard.PayloadHashesEqual(
                        observation.PayloadHashSha256,
                        SecurityAssetAssertionGuard.ComputeExpiryObservationHash(
                            expired.AssertionId,
                            finding.FindingId))))
            {
                continue;
            }

            OperationalSecurityFindingObservationRecord observation = new()
            {
                ObservationId = Guid.NewGuid(),
                FindingId = finding.FindingId,
                TenantId = tenantId,
                ObservedUtc = utcNow,
                Status = finding.Status,
                Severity = finding.Severity,
                RiskScore = finding.RiskScore,
                Summary =
                    "Human asset assertion expired; crown-jewel classification no longer applies to ranking.",
                PayloadHashSha256 = SecurityAssetAssertionGuard.ComputeExpiryObservationHash(
                    expired.AssertionId,
                    finding.FindingId),
                SourceSystem = SecurityAssetAssertionConstants.AssertionExpirySourceSystem,
            };

            OperationalSecurityFindingRecord updated = CloneFinding(finding, utcNow);

            await findingRepository.UpdateAsync(updated, [], observation, cancellationToken);
            created++;
        }

        return created;
    }

    private static OperationalSecurityFindingRecord CloneFinding(
        OperationalSecurityFindingRecord source,
        DateTime utcNow) =>
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
            LastObservedUtc = utcNow,
            Status = source.Status,
            RawEvidenceReference = source.RawEvidenceReference,
            AssessmentId = source.AssessmentId,
            InventoryDiffId = source.InventoryDiffId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            PayloadHashSha256 = source.PayloadHashSha256,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = utcNow,
        };

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorId,
        string eventType,
        Guid assertionId,
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
                    new { assertionId, payload },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }
}
