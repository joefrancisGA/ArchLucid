using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class FourRealityDriftEngine(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAzureInventoryDiffRepository diffRepository,
    IArchitectureDiagramReconciliationRepository reconciliationRepository,
    ISecurityEvidencePathRepository pathRepository,
    IOperationalSecurityFindingIngestService findingIngestService,
    ILogger<FourRealityDriftEngine> logger) : IFourRealityDriftEngine
{
    private static readonly JsonSerializerOptions DiagramJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task<PrivilegePathEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (snapshotId == Guid.Empty)
        {
            return Failed("SnapshotId is required.");
        }

        if (string.IsNullOrWhiteSpace(actorId))
        {
            return Failed("ActorId is required.");
        }

        SecureNowAnalysisSnapshot? analysisSnapshot =
            await SecureNowAnalysisRun.LoadAsync(snapshotRepository, scope, snapshotId, cancellationToken);
        AzureInventorySnapshotDetailReadModel? currentSnapshot = analysisSnapshot?.Snapshot;

        if (currentSnapshot is null)
        {
            return Failed("Snapshot was not found in the current tenant scope.");
        }

        Guid? inventoryDiffId = null;
        IReadOnlyList<AzureInventoryChangeRecord> diffChanges = [];
        Dictionary<Guid, IReadOnlyDictionary<string, string>> priorPropertiesByCloudResourceId = new();

        DiagramInfrastructureReconciliationResult? diagramReconciliation =
            await TryLoadDiagramReconciliationAsync(scope, snapshotId, cancellationToken);

        IReadOnlyList<SecurityEvidencePathWithHops> pathsWithHops = await pathRepository.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId),
            cancellationToken);

        List<SecurityEvidencePathRecord> sourcePaths = [];
        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> hopsByPathId = new();

        foreach (SecurityEvidencePathWithHops pathWithHops in pathsWithHops)
        {
            if (pathWithHops.Path.PathKind is not (PathKind.Privilege or PathKind.IntendedReachability))
            {
                continue;
            }

            sourcePaths.Add(pathWithHops.Path);
            hopsByPathId[pathWithHops.Path.PathId] = pathWithHops.Hops;
        }

        HashSet<Guid> pathCloudResourceIds = FourRealityDriftAnalyzer.CollectCloudResourceIdsForSourcePaths(
            currentSnapshot,
            sourcePaths,
            hopsByPathId);

        List<Guid> pathCloudResourceIdList = pathCloudResourceIds.ToList();

        if (!string.IsNullOrWhiteSpace(currentSnapshot.Header.SubscriptionId))
        {
            Guid? priorSnapshotId = await snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(
                scope,
                currentSnapshot.Header.SubscriptionId,
                snapshotId,
                cancellationToken);

            if (priorSnapshotId is Guid priorId && priorId != Guid.Empty)
            {
                AzureInventoryDiffSummaryRecord? diffSummary =
                    await diffRepository.TryGetBySnapshotPairAsync(scope, priorId, snapshotId, cancellationToken);

                    if (diffSummary is not null)
                    {
                        inventoryDiffId = diffSummary.DiffId;
                        diffChanges = await diffRepository.ListChangesByDiffIdAndCloudResourceIdsAsync(
                            scope,
                            diffSummary.DiffId,
                            pathCloudResourceIdList,
                            cancellationToken)
                            ?? [];
                    }

                    if (pathCloudResourceIdList.Count > 0)
                    {
                        (IReadOnlyList<AzureInventoryResourceRecord>? priorResources,
                                IReadOnlyList<AzureInventoryResourcePropertyReadModel>? priorProperties) =
                            await snapshotRepository.ListResourcesAndPropertiesByCloudResourceIdsAsync(
                                scope,
                                priorId,
                                pathCloudResourceIdList,
                                cancellationToken);

                        foreach (AzureInventoryResourceRecord priorResource in priorResources ?? [])
                        {
                            if (priorResource.CloudResourceId is not Guid priorCloudResourceId)
                            {
                                continue;
                            }

                            priorPropertiesByCloudResourceId[priorCloudResourceId] =
                                FourRealityResourceAccessReader.BuildPropertyBag(
                                    priorProperties ?? [],
                                    priorResource.ResourceRowId);
                        }
                    }
            }
        }

        IReadOnlyList<FourRealityDriftCandidate> candidates = FourRealityDriftAnalyzer.Analyze(
            new FourRealityDriftAnalysisInputs
            {
                CurrentSnapshot = currentSnapshot,
                PriorPropertiesByCloudResourceId = priorPropertiesByCloudResourceId,
                InventoryDiffId = inventoryDiffId,
                DiffChanges = diffChanges,
                DiagramReconciliation = diagramReconciliation,
                SourcePaths = sourcePaths,
                HopsByPathId = hopsByPathId,
            });

        if (candidates.Count == 0)
        {
            return new PrivilegePathEngineResult
            {
                Succeeded = true,
                PathsDiscovered = 0,
            };
        }

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        List<OperationalSecurityFindingIngestItem> ingestItems = [];
        int pathsPersisted = 0;

        foreach (FourRealityDriftCandidate candidate in candidates)
        {
            SecurityEvidencePathRecord? sourcePath = sourcePaths
                .FirstOrDefault(path => path.PathId == candidate.SourcePathId);

            byte[] sourceCanonicalHash = sourcePath?.CanonicalHopHashSha256
                                         ?? SecurityEvidencePathCanonicalHash.ComputeSha256(candidate.SourceHops);

            Guid pathId = Guid.NewGuid();
            IReadOnlyList<SecurityEvidencePathHopRecord> hopRecords =
                FourRealityDriftMaterializer.BuildHopRecords(scope.TenantId, pathId, snapshotId, candidate);

            SecurityEvidencePathRecord header = new()
            {
                PathId = pathId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = snapshotId,
                PathKind = PathKind.FourRealityDrift,
                PathConfidenceBand = PathConfidenceBand.Confirmed,
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            };

            SecurityEvidencePathInsertResult insertResult;

            try
            {
                insertResult = await pathRepository.InsertIfNotExistsAsync(header, hopRecords, cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Four-reality drift path persist failed for SnapshotId={SnapshotId}.", snapshotId);

                continue;
            }

            if (insertResult.Created)
            {
                pathsPersisted++;
            }

            Dictionary<string, string?> metadata = new(StringComparer.Ordinal)
            {
                ["pathKind"] = PathKind.FourRealityDrift.ToString(),
                ["sourcePathId"] = candidate.SourcePathId.ToString("D"),
                ["sourcePathKind"] = candidate.SourcePathKind.ToString(),
                ["cloudResourceId"] = candidate.CloudResourceId.ToString("D"),
                ["observedPosture"] = candidate.ObservedPosture.ToString(),
                ["terraformPosture"] = candidate.TerraformPosture.ToString(),
                ["diagramPosture"] = candidate.DiagramPosture.ToString(),
                ["historicalPosture"] = candidate.HistoricalPosture.ToString(),
            };

            if (candidate.RelatedChangeId is Guid changeId)
            {
                metadata["changeId"] = changeId.ToString("D");
            }

            ingestItems.Add(new OperationalSecurityFindingIngestItem
            {
                Provider = CloudProvider.Azure,
                SourceSystem = SecureNowArchitectConstants.SourceSystem,
                SourceFindingId = FourRealityDriftNarrative.BuildSourceFindingId(
                    sourceCanonicalHash,
                    candidate.CloudResourceId,
                    candidate.RelatedChangeId),
                PathId = insertResult.PathId,
                CloudResourceId = candidate.CloudResourceId,
                ExternalResourceId = candidate.AzureResourceId,
                ResourceType = candidate.ResourceType,
                SubscriptionOrAccountId = currentSnapshot.Header.SubscriptionId,
                ControlId = SecureNowArchitectConstants.FourRealityDriftControlId,
                ControlFramework = SecureNowArchitectConstants.SourceSystem,
                Title = FourRealityDriftNarrative.BuildTitle(candidate),
                Description = FourRealityDriftNarrative.BuildDescription(candidate),
                Severity = FourRealityDriftNarrative.SeverityNotScoredLabel,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
                Status = OperationalSecurityFindingStatus.Open,
                RawEvidenceReference = $"snapshot:{snapshotId:D}",
                InventoryDiffId = candidate.InventoryDiffId,
                Metadata = metadata,
            });
        }

        OperationalSecurityFindingBatchIngestResult ingestResult = await findingIngestService.IngestBatchAsync(
            scope,
            ingestItems,
            actorId,
            cancellationToken);

        return new PrivilegePathEngineResult
        {
            Succeeded = true,
            PathsDiscovered = candidates.Count,
            PathsPersisted = pathsPersisted,
            FindingsIngested = ingestResult.IngestedCount,
            FindingsDeduplicated = ingestResult.DeduplicatedCount,
        };
    }

    private async Task<DiagramInfrastructureReconciliationResult?> TryLoadDiagramReconciliationAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ArchitectureDiagramReconciliationPersistRecord> records =
            await reconciliationRepository.ListBySnapshotAsync(scope.TenantId, snapshotId, cancellationToken)
            ?? [];

        foreach (ArchitectureDiagramReconciliationPersistRecord record in records)
        {
            if (string.IsNullOrWhiteSpace(record.ResultJson))
            {
                continue;
            }

            try
            {
                return JsonSerializer.Deserialize<DiagramInfrastructureReconciliationResult>(
                    record.ResultJson,
                    DiagramJsonOptions);
            }
            catch (JsonException ex)
            {
                logger.LogWarning(
                    ex,
                    "Failed to deserialize diagram reconciliation for SnapshotId={SnapshotId}, RunId={RunId}.",
                    snapshotId,
                    record.RunId);

                continue;
            }
        }

        return null;
    }

    private static PrivilegePathEngineResult Failed(string message) =>
        new()
        {
            Succeeded = false,
            ErrorMessage = message,
        };
}
