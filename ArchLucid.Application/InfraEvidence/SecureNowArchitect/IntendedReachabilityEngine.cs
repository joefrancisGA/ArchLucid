using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class IntendedReachabilityEngine(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    IOperationalSecurityFindingIngestService findingIngestService,
    ILogger<IntendedReachabilityEngine> logger,
    ISecurityEvidencePathSearchCoverageRepository searchCoverageRepository) : IIntendedReachabilityEngine
{
    public async Task<PrivilegePathEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default,
        SecureNowArchitectEngineRunScope? runScope = null,
        PrivilegePathEngineOptions? options = null)
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
        AzureInventorySnapshotDetailReadModel? snapshot = analysisSnapshot?.Snapshot;

        if (snapshot is null)
        {
            return Failed("Snapshot was not found in the current tenant scope.");
        }

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot, analysisSnapshot);
        bool continuationEnabled = options is null;
        PrivilegePathEngineOptions resolvedOptions = options ?? new PrivilegePathEngineOptions();
        ReachabilityPathEnumerationResult enumeration = IntendedReachabilityPathEnumerator.EnumerateWithLimits(
            graph,
            resolvedOptions,
            runScope);
        enumeration = SecurityEvidencePathSearchContinuation.ApplyIfNeeded(
            graph,
            enumeration,
            continuationEnabled,
            runScope,
            scope.TenantId,
            snapshotId);
        await SecurityEvidencePathSearchCoverageRecorder.ReplaceAsync(
            searchCoverageRepository,
            scope,
            snapshotId,
            SecurityEvidencePathSearchEngineNames.IntendedReachability,
            enumeration.LimitHits,
            cancellationToken);
        IReadOnlyList<ReachabilityPathCandidate> candidates = enumeration.Candidates;

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
        List<SecurityEvidencePathWithHops> pathWrites = [];

        foreach (ReachabilityPathCandidate candidate in candidates)
        {
            Guid pathId = Guid.NewGuid();
            IReadOnlyList<SecurityEvidencePathHopRecord> hopRecords =
                ReachabilityPathMaterializer.BuildHopRecords(scope.TenantId, pathId, snapshotId, candidate.Hops);

            SecurityEvidencePathRecord header = new()
            {
                PathId = pathId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = snapshotId,
                PathKind = PathKind.IntendedReachability,
                PathConfidenceBand = SecurityEvidencePathConfidenceBandResolver.ResolveWeakestHopBand(hopRecords),
                CreatedUtc = utcNow,
                UpdatedUtc = utcNow,
            };

            pathWrites.Add(new(header, hopRecords));
        }

        IReadOnlyList<SecurityEvidencePathInsertResult> insertResults;
        try
        {
            insertResults = await pathRepository.InsertBatchIfNotExistsAsync(pathWrites, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Reachability path batch persist failed for SnapshotId={SnapshotId}.", snapshotId);
            return Failed("Reachability path batch persist failed.");
        }
        int pathsPersisted = insertResults.Count(result => result.Created);
        for (int index = 0; index < candidates.Count; index++)
        {
            ReachabilityPathCandidate candidate = candidates[index];
            SecurityEvidencePathInsertResult insertResult = insertResults[index];
            byte[] canonicalHash = SecurityEvidencePathCanonicalHash.ComputeSha256(pathWrites[index].Hops);

            PrivilegePathSeverityResult severity = IntendedReachabilitySeverityTable.Resolve(
                candidate.HasInsufficientEvidenceHop,
                candidate.ScopeTaggedProduction);

            ingestItems.Add(new OperationalSecurityFindingIngestItem
            {
                Provider = CloudProvider.Azure,
                SourceSystem = SecureNowArchitectConstants.SourceSystem,
                SourceFindingId = Convert.ToHexStringLower(canonicalHash),
                PathId = insertResult.PathId,
                CloudResourceId = candidate.TerminalCloudResourceId,
                ExternalResourceId = candidate.TerminalAssetNodeId,
                ResourceType = candidate.TerminalResourceType,
                SubscriptionOrAccountId = snapshot.Header.SubscriptionId,
                ControlId = SecureNowArchitectConstants.IntendedReachabilityControlId,
                ControlFramework = SecureNowArchitectConstants.SourceSystem,
                Title = IntendedReachabilityPathNarrative.BuildTitle(candidate),
                Description = IntendedReachabilityPathNarrative.BuildDescription(candidate),
                Severity = severity.Severity,
                BusinessCriticality = severity.BusinessCriticality,
                BlastRadius = severity.BlastRadius,
                Status = OperationalSecurityFindingStatus.Open,
                RawEvidenceReference = $"snapshot:{snapshotId:D}",
                Metadata = new Dictionary<string, string?>
                {
                    ["pathKind"] = PathKind.IntendedReachability.ToString(),
                    ["hopCount"] = candidate.Hops.Count.ToString(),
                },
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

    private static PrivilegePathEngineResult Failed(string message) =>
        new()
        {
            Succeeded = false,
            ErrorMessage = message,
        };
}
