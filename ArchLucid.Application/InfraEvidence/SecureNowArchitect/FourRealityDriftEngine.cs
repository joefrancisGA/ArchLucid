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

        AzureInventorySnapshotDetailReadModel? currentSnapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (currentSnapshot is null)
        {
            return Failed("Snapshot was not found in the current tenant scope.");
        }

        AzureInventorySnapshotDetailReadModel? priorSnapshot = null;
        Guid? inventoryDiffId = null;
        IReadOnlyList<AzureInventoryChangeRecord> diffChanges = [];

        if (!string.IsNullOrWhiteSpace(currentSnapshot.Header.SubscriptionId))
        {
            Guid? priorSnapshotId = await snapshotRepository.TryGetPriorMaterializedSnapshotIdAsync(
                scope,
                currentSnapshot.Header.SubscriptionId,
                snapshotId,
                cancellationToken);

            if (priorSnapshotId is Guid priorId && priorId != Guid.Empty)
            {
                priorSnapshot = await snapshotRepository.TryGetSnapshotDetailAsync(scope, priorId, cancellationToken);

                AzureInventoryDiffSummaryRecord? diffSummary =
                    await diffRepository.TryGetBySnapshotPairAsync(scope, priorId, snapshotId, cancellationToken);

                if (diffSummary is not null)
                {
                    inventoryDiffId = diffSummary.DiffId;
                    diffChanges = await diffRepository.ListChangesByDiffIdAsync(
                        scope,
                        diffSummary.DiffId,
                        cancellationToken);
                }
            }
        }

        DiagramInfrastructureReconciliationResult? diagramReconciliation =
            await TryLoadDiagramReconciliationAsync(scope, snapshotId, cancellationToken);

        IReadOnlyList<SecurityEvidencePathRecord> privilegePaths = await pathRepository.ListBySnapshotAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshotId,
            cancellationToken);

        List<SecurityEvidencePathRecord> sourcePaths = privilegePaths
            .Where(path => path.PathKind is PathKind.Privilege or PathKind.IntendedReachability)
            .ToList();

        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> hopsByPathId = new();

        foreach (SecurityEvidencePathRecord sourcePath in sourcePaths)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathAsync(scope.TenantId, sourcePath.PathId, cancellationToken);

            hopsByPathId[sourcePath.PathId] = hops;
        }

        IReadOnlyList<FourRealityDriftCandidate> candidates = FourRealityDriftAnalyzer.Analyze(
            new FourRealityDriftAnalysisInputs
            {
                CurrentSnapshot = currentSnapshot,
                PriorSnapshot = priorSnapshot,
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
                Severity = "high",
                BusinessCriticality = "high",
                BlastRadius = "path-dependent",
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
        IReadOnlyList<Guid> runIds = await reconciliationRepository.ListRunIdsBySnapshotAsync(
            scope.TenantId,
            snapshotId,
            cancellationToken);

        foreach (Guid runId in runIds)
        {
            ArchitectureDiagramReconciliationPersistRecord? record =
                await reconciliationRepository.TryGetByRunAndSnapshotAsync(
                    scope.TenantId,
                    runId,
                    snapshotId,
                    cancellationToken);

            if (record is null || string.IsNullOrWhiteSpace(record.ResultJson))
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
                    runId);

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
