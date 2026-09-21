using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;

public sealed class OperationalSecurityFindingIngestService(
    IOperationalSecurityFindingRepository repository,
    IAuditService auditService,
    ILogger<OperationalSecurityFindingIngestService> logger) : IOperationalSecurityFindingIngestService
{
    public async Task<OperationalSecurityFindingBatchIngestResult> IngestBatchAsync(
        ScopeContext scope,
        IReadOnlyList<OperationalSecurityFindingIngestItem> items,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(items);

        if (string.IsNullOrWhiteSpace(actorId))
            throw new ArgumentException("ActorId is required.", nameof(actorId));

        List<OperationalSecurityFindingIngestItemResult> results = [];
        int ingestedCount = 0;
        int deduplicatedCount = 0;
        int failedCount = 0;

        for (int index = 0; index < items.Count; index++)
        {
            OperationalSecurityFindingIngestItem item = items[index];

            if (item is null)
            {
                results.Add(new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = false,
                    ErrorMessage = "Null item in batch.",
                });
                failedCount++;
                continue;
            }

            OperationalSecurityFindingIngestItemResult itemResult =
                await IngestSingleAsync(scope, item, actorId, index, cancellationToken);

            results.Add(itemResult);

            if (!itemResult.Succeeded)
            {
                failedCount++;
                continue;
            }

            if (itemResult.WasDeduplicated)
                deduplicatedCount++;
            else
                ingestedCount++;
        }

        return new OperationalSecurityFindingBatchIngestResult
        {
            Items = results,
            IngestedCount = ingestedCount,
            DeduplicatedCount = deduplicatedCount,
            FailedCount = failedCount,
        };
    }

    public async Task<OperationalSecurityFindingDetailResult> TryGetDetailAsync(
        ScopeContext scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (findingId == Guid.Empty)
        {
            return new OperationalSecurityFindingDetailResult
            {
                Succeeded = false,
                ErrorMessage = "FindingId is required.",
            };
        }

        OperationalSecurityFindingRecord? finding =
            await repository.TryGetByIdInScopeAsync(
                scope.ToProjectScopeKey(),
                findingId,
                cancellationToken);

        if (finding is null)
        {
            return new OperationalSecurityFindingDetailResult
            {
                Succeeded = false,
                ErrorMessage = "Operational security finding was not found in current tenant scope.",
            };
        }

        IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
            await repository.ListMetadataByFindingAsync(scope.TenantId, findingId, cancellationToken);

        IReadOnlyList<OperationalSecurityFindingObservationRecord> observations =
            await repository.ListObservationsByFindingAsync(scope.TenantId, findingId, cancellationToken);

        return new OperationalSecurityFindingDetailResult
        {
            Succeeded = true,
            Finding = finding,
            Metadata = metadata,
            Observations = observations,
        };
    }

    private async Task<OperationalSecurityFindingIngestItemResult> IngestSingleAsync(
        ScopeContext scope,
        OperationalSecurityFindingIngestItem item,
        string actorId,
        int index,
        CancellationToken cancellationToken)
    {
        if (!OperationalSecurityFindingGuard.TryValidateIngestItem(item, out string? validationError))
        {
            return new OperationalSecurityFindingIngestItemResult
            {
                Index = index,
                Succeeded = false,
                ErrorMessage = validationError,
            };
        }

        try
        {
            DateTime observedUtc = item.ObservedUtc ?? TimeProvider.System.UtcNowDateTime();
            byte[] payloadHash = OperationalSecurityFindingGuard.ComputePayloadHash(item);

            OperationalSecurityFindingRecord? existing = await repository.TryGetByNaturalKeyInScopeAsync(
                scope.ToProjectScopeKey(),
                item.Provider,
                item.SourceSystem.Trim(),
                item.SourceFindingId.Trim(),
                cancellationToken);

            if (existing is null)
            {
                Guid findingId = Guid.NewGuid();
                OperationalSecurityFindingRecord finding = BuildFindingRecord(
                    findingId,
                    scope,
                    item,
                    observedUtc,
                    observedUtc,
                    item.Status,
                    payloadHash,
                    observedUtc);

                OperationalSecurityFindingObservationRecord observation = BuildObservation(
                    findingId,
                    scope.TenantId,
                    item,
                    observedUtc,
                    item.Status,
                    payloadHash);

                IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata =
                    BuildMetadata(findingId, scope.TenantId, item.Metadata);

                await repository.InsertAsync(finding, metadata, observation, cancellationToken);

                await LogAuditAsync(
                    scope,
                    actorId,
                    AuditEventTypes.OperationalSecurityFindingIngested,
                    findingId,
                    item,
                    cancellationToken);

                return new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = true,
                    FindingId = findingId,
                };
            }

            if (OperationalSecurityFindingGuard.PayloadHashesEqual(existing.PayloadHashSha256, payloadHash))
            {
                OperationalSecurityFindingRecord touchRecord = CloneFinding(
                    existing,
                    lastObservedUtc: observedUtc,
                    updatedUtc: observedUtc);

                await repository.UpdateInScopeAsync(
                    scope.ToProjectScopeKey(),
                    ToMutation(touchRecord),
                    [],
                    observation: null,
                    cancellationToken);

                await LogAuditAsync(
                    scope,
                    actorId,
                    AuditEventTypes.OperationalSecurityFindingDeduplicated,
                    existing.FindingId,
                    item,
                    cancellationToken);

                return new OperationalSecurityFindingIngestItemResult
                {
                    Index = index,
                    Succeeded = true,
                    WasDeduplicated = true,
                    FindingId = existing.FindingId,
                };
            }

            OperationalSecurityFindingStatus nextStatus = ResolveUpdatedStatus(existing.Status, item.Status);

            OperationalSecurityFindingRecord updatedFinding = CloneFinding(
                existing,
                cloudResourceId: item.CloudResourceId ?? existing.CloudResourceId,
                externalResourceId: item.ExternalResourceId?.Trim() ?? existing.ExternalResourceId,
                resourceType: item.ResourceType?.Trim() ?? existing.ResourceType,
                subscriptionOrAccountId: item.SubscriptionOrAccountId?.Trim() ?? existing.SubscriptionOrAccountId,
                controlId: item.ControlId?.Trim() ?? existing.ControlId,
                controlFramework: item.ControlFramework?.Trim() ?? existing.ControlFramework,
                title: item.Title.Trim(),
                description: item.Description?.Trim() ?? existing.Description,
                severity: item.Severity?.Trim() ?? existing.Severity,
                riskScore: item.RiskScore ?? existing.RiskScore,
                exploitability: item.Exploitability?.Trim() ?? existing.Exploitability,
                exposure: item.Exposure?.Trim() ?? existing.Exposure,
                businessCriticality: item.BusinessCriticality?.Trim() ?? existing.BusinessCriticality,
                blastRadius: item.BlastRadius?.Trim() ?? existing.BlastRadius,
                lastObservedUtc: observedUtc,
                status: nextStatus,
                rawEvidenceReference: item.RawEvidenceReference?.Trim() ?? existing.RawEvidenceReference,
                assessmentId: item.AssessmentId ?? existing.AssessmentId,
                inventoryDiffId: item.InventoryDiffId ?? existing.InventoryDiffId,
                auditEvidenceSnapshotId: item.AuditEvidenceSnapshotId ?? existing.AuditEvidenceSnapshotId,
                pathId: item.PathId ?? existing.PathId,
                payloadHashSha256: payloadHash,
                updatedUtc: observedUtc);

            OperationalSecurityFindingObservationRecord observationRecord = BuildObservation(
                existing.FindingId,
                scope.TenantId,
                item,
                observedUtc,
                nextStatus,
                payloadHash);

            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadataRows =
                BuildMetadata(existing.FindingId, scope.TenantId, item.Metadata);

            await repository.UpdateInScopeAsync(
                scope.ToProjectScopeKey(),
                ToMutation(updatedFinding),
                metadataRows.Select(ToMutation).ToList(),
                ToMutation(observationRecord),
                cancellationToken);

            await LogAuditAsync(
                scope,
                actorId,
                AuditEventTypes.OperationalSecurityFindingIngested,
                existing.FindingId,
                item,
                cancellationToken);

            return new OperationalSecurityFindingIngestItemResult
            {
                Index = index,
                Succeeded = true,
                FindingId = existing.FindingId,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarningWithExceptionAndTwoSanitizedUserStrings(
                ex,
                "Operational security finding ingest failed for SourceSystem={SourceSystem} SourceFindingId={SourceFindingId}.",
                item.SourceSystem,
                item.SourceFindingId);

            return new OperationalSecurityFindingIngestItemResult
            {
                Index = index,
                Succeeded = false,
                ErrorMessage = "Operational security finding ingest failed.",
            };
        }
    }

    private static OperationalSecurityFindingRecord CloneFinding(
        OperationalSecurityFindingRecord source,
        Guid? cloudResourceId = null,
        string? externalResourceId = null,
        string? resourceType = null,
        string? subscriptionOrAccountId = null,
        string? controlId = null,
        string? controlFramework = null,
        string? title = null,
        string? description = null,
        string? severity = null,
        decimal? riskScore = null,
        string? exploitability = null,
        string? exposure = null,
        string? businessCriticality = null,
        string? blastRadius = null,
        DateTime? lastObservedUtc = null,
        OperationalSecurityFindingStatus? status = null,
        string? rawEvidenceReference = null,
        Guid? assessmentId = null,
        Guid? inventoryDiffId = null,
        Guid? auditEvidenceSnapshotId = null,
        Guid? pathId = null,
        byte[]? payloadHashSha256 = null,
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
            CloudResourceId = cloudResourceId ?? source.CloudResourceId,
            ExternalResourceId = externalResourceId ?? source.ExternalResourceId,
            ResourceType = resourceType ?? source.ResourceType,
            SubscriptionOrAccountId = subscriptionOrAccountId ?? source.SubscriptionOrAccountId,
            ControlId = controlId ?? source.ControlId,
            ControlFramework = controlFramework ?? source.ControlFramework,
            Title = title ?? source.Title,
            Description = description ?? source.Description,
            Severity = severity ?? source.Severity,
            RiskScore = riskScore ?? source.RiskScore,
            Exploitability = exploitability ?? source.Exploitability,
            Exposure = exposure ?? source.Exposure,
            BusinessCriticality = businessCriticality ?? source.BusinessCriticality,
            BlastRadius = blastRadius ?? source.BlastRadius,
            FirstObservedUtc = source.FirstObservedUtc,
            LastObservedUtc = lastObservedUtc ?? source.LastObservedUtc,
            Status = status ?? source.Status,
            RawEvidenceReference = rawEvidenceReference ?? source.RawEvidenceReference,
            AssessmentId = assessmentId ?? source.AssessmentId,
            InventoryDiffId = inventoryDiffId ?? source.InventoryDiffId,
            AuditEvidenceSnapshotId = auditEvidenceSnapshotId ?? source.AuditEvidenceSnapshotId,
            PathId = pathId ?? source.PathId,
            PayloadHashSha256 = payloadHashSha256 ?? source.PayloadHashSha256,
            CreatedUtc = source.CreatedUtc,
            UpdatedUtc = updatedUtc ?? source.UpdatedUtc,
        };

    private static OperationalSecurityFindingMutation ToMutation(OperationalSecurityFindingRecord source) =>
        new()
        {
            FindingId = source.FindingId,
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
            LastObservedUtc = source.LastObservedUtc,
            Status = source.Status,
            RawEvidenceReference = source.RawEvidenceReference,
            AssessmentId = source.AssessmentId,
            InventoryDiffId = source.InventoryDiffId,
            AuditEvidenceSnapshotId = source.AuditEvidenceSnapshotId,
            PathId = source.PathId,
            PayloadHashSha256 = source.PayloadHashSha256,
            UpdatedUtc = source.UpdatedUtc,
        };

    private static OperationalSecurityFindingMetadataMutation ToMutation(
        OperationalSecurityFindingMetadataRecord source) =>
        new()
        {
            MetadataRowId = source.MetadataRowId,
            FindingId = source.FindingId,
            MetadataKey = source.MetadataKey,
            MetadataValue = source.MetadataValue,
        };

    private static OperationalSecurityFindingObservationMutation ToMutation(
        OperationalSecurityFindingObservationRecord source) =>
        new()
        {
            ObservationId = source.ObservationId,
            FindingId = source.FindingId,
            ObservedUtc = source.ObservedUtc,
            Status = source.Status,
            Severity = source.Severity,
            RiskScore = source.RiskScore,
            Summary = source.Summary ?? string.Empty,
            PayloadHashSha256 = source.PayloadHashSha256,
            SourceSystem = source.SourceSystem,
        };

    private static OperationalSecurityFindingStatus ResolveUpdatedStatus(
        OperationalSecurityFindingStatus existingStatus,
        OperationalSecurityFindingStatus incomingStatus)
    {
        if (existingStatus == OperationalSecurityFindingStatus.Closed
            && incomingStatus == OperationalSecurityFindingStatus.Open)
        {
            return OperationalSecurityFindingStatus.Recurred;
        }

        return incomingStatus;
    }

    private static OperationalSecurityFindingRecord BuildFindingRecord(
        Guid findingId,
        ScopeContext scope,
        OperationalSecurityFindingIngestItem item,
        DateTime firstObservedUtc,
        DateTime lastObservedUtc,
        OperationalSecurityFindingStatus status,
        byte[] payloadHash,
        DateTime utcNow) =>
        new()
        {
            FindingId = findingId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Provider = item.Provider,
            SourceSystem = item.SourceSystem.Trim(),
            SourceFindingId = item.SourceFindingId.Trim(),
            CloudResourceId = item.CloudResourceId,
            ExternalResourceId = item.ExternalResourceId?.Trim(),
            ResourceType = item.ResourceType?.Trim(),
            SubscriptionOrAccountId = item.SubscriptionOrAccountId?.Trim(),
            ControlId = item.ControlId?.Trim(),
            ControlFramework = item.ControlFramework?.Trim(),
            Title = item.Title.Trim(),
            Description = item.Description?.Trim(),
            Severity = item.Severity?.Trim(),
            RiskScore = item.RiskScore,
            Exploitability = item.Exploitability?.Trim(),
            Exposure = item.Exposure?.Trim(),
            BusinessCriticality = item.BusinessCriticality?.Trim(),
            BlastRadius = item.BlastRadius?.Trim(),
            FirstObservedUtc = firstObservedUtc,
            LastObservedUtc = lastObservedUtc,
            Status = status,
            RawEvidenceReference = item.RawEvidenceReference?.Trim(),
            AssessmentId = item.AssessmentId,
            InventoryDiffId = item.InventoryDiffId,
            AuditEvidenceSnapshotId = item.AuditEvidenceSnapshotId,
            PathId = item.PathId,
            PayloadHashSha256 = payloadHash,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
        };

    private static OperationalSecurityFindingObservationRecord BuildObservation(
        Guid findingId,
        Guid tenantId,
        OperationalSecurityFindingIngestItem item,
        DateTime observedUtc,
        OperationalSecurityFindingStatus status,
        byte[] payloadHash) =>
        new()
        {
            ObservationId = Guid.NewGuid(),
            FindingId = findingId,
            TenantId = tenantId,
            ObservedUtc = observedUtc,
            Status = status,
            Severity = item.Severity?.Trim(),
            RiskScore = item.RiskScore,
            Summary = item.Description?.Trim() ?? item.Title.Trim(),
            PayloadHashSha256 = payloadHash,
            SourceSystem = item.SourceSystem.Trim(),
        };

    private static IReadOnlyList<OperationalSecurityFindingMetadataRecord> BuildMetadata(
        Guid findingId,
        Guid tenantId,
        IReadOnlyDictionary<string, string?> metadata) =>
        metadata
            .Select(pair => new OperationalSecurityFindingMetadataRecord
            {
                MetadataRowId = Guid.NewGuid(),
                FindingId = findingId,
                TenantId = tenantId,
                MetadataKey = pair.Key.Trim(),
                MetadataValue = pair.Value,
            })
            .ToList();

    private async Task LogAuditAsync(
        ScopeContext scope,
        string actorId,
        string eventType,
        Guid findingId,
        OperationalSecurityFindingIngestItem item,
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
                    new
                    {
                        findingId,
                        provider = item.Provider.ToString(),
                        sourceSystem = item.SourceSystem.Trim(),
                        sourceFindingId = item.SourceFindingId.Trim(),
                    },
                    AuditJsonSerializationOptions.Instance),
            },
            cancellationToken);
    }
}
