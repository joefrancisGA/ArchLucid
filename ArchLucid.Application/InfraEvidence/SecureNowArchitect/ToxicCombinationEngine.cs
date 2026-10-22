using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class ToxicCombinationEngine(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    IOperationalSecurityFindingIngestService findingIngestService,
    ILogger<ToxicCombinationEngine> logger,
    ISecurityEvidencePathSearchCoverageRepository searchCoverageRepository) : IToxicCombinationEngine
{
    public async Task<PrivilegePathEngineResult> RunAsync(
        ScopeContext scope,
        Guid snapshotId,
        string actorId,
        CancellationToken cancellationToken = default,
        SecureNowArchitectEngineRunScope? runScope = null)
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

        IReadOnlyList<SecurityEvidencePathWithHops> existingPaths = await pathRepository.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId), cancellationToken);
        IReadOnlyList<ToxicCombinationPathSnapshot> reachabilityPaths =
            ToxicCombinationPathLoader.BuildSnapshots(existingPaths, PathKind.IntendedReachability, snapshot, analysisSnapshot);
        IReadOnlyList<ToxicCombinationPathSnapshot> privilegePaths =
            ToxicCombinationPathLoader.BuildSnapshots(existingPaths, PathKind.Privilege, snapshot, analysisSnapshot);

        if (reachabilityPaths.Count == 0 || privilegePaths.Count == 0)
        {
            return new PrivilegePathEngineResult
            {
                Succeeded = true,
                PathsDiscovered = 0,
            };
        }

        IReadOnlyDictionary<string, PrivilegePathEdge> egressBySubnetArmId =
            ToxicCombinationEgressDetector.DetectUnrestrictedEgressBySubnet(snapshot);

        HashSet<Guid>? affectedPathIds = null;
        if (runScope is { IsFullEstate: false })
        {
            IReadOnlyDictionary<string, Guid> resourceIds =
                analysisSnapshot!.CloudResourceIdsByArmId;
            affectedPathIds = existingPaths.Where(item => SecureNowArchitectNeighborhoodFilter.PathTouchesSeeds(
                item.Hops, runScope.SeedCloudResourceIds, resourceIds)).Select(item => item.Path.PathId).ToHashSet();
            foreach (ToxicCombinationPathSnapshot path in reachabilityPaths.Concat(privilegePaths))
                if (path.TerminalCloudResourceId is Guid id && runScope.SeedCloudResourceIds.Contains(id))
                    affectedPathIds.Add(path.Path.PathId);
        }

        IReadOnlyList<ToxicCombinationCandidate> candidates = ToxicCombinationPathComposer.Compose(
            reachabilityPaths,
            privilegePaths,
            egressBySubnetArmId,
            affectedPathIds is null ? null : (reachability, privilege) =>
                affectedPathIds.Contains(reachability.Path.PathId) || affectedPathIds.Contains(privilege.Path.PathId));

        if (runScope is { IsFullEstate: false })
        {
            IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId =
                analysisSnapshot!.CloudResourceIdsByArmId;

            Dictionary<Guid, ToxicCombinationPathSnapshot> reachabilityByPathId = reachabilityPaths
                .ToDictionary(path => path.Path.PathId);

            Dictionary<Guid, ToxicCombinationPathSnapshot> privilegeByPathId = privilegePaths
                .ToDictionary(path => path.Path.PathId);

            candidates = candidates
                .Where(candidate => SecureNowArchitectNeighborhoodFilter.ToxicCombinationTouchesSeeds(
                    candidate,
                    runScope.SeedCloudResourceIds,
                    reachabilityByPathId,
                    privilegeByPathId,
                    cloudResourceIdByArmId))
                .ToList();
        }

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
        DefenderSecureScoreOrdinalBand defenderSecureScoreBand =
            DefenderSnapshotContextResolver.ResolveSubscriptionBand(snapshot);

        foreach (ToxicCombinationCandidate candidate in candidates)
        {
            Guid pathId = Guid.NewGuid();
            IReadOnlyList<SecurityEvidencePathHopRecord> hopRecords =
                ToxicCombinationPathMaterializer.RenumberForPath(scope.TenantId, pathId, candidate.Hops);

            SecurityEvidencePathRecord header = new()
            {
                PathId = pathId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = snapshotId,
                PathKind = PathKind.ToxicCombination,
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
            logger.LogWarning(ex, "Toxic combination path batch persist failed for SnapshotId={SnapshotId}.", snapshotId);
            return Failed("Toxic combination path batch persist failed.");
        }
        int pathsPersisted = insertResults.Count(result => result.Created);
        for (int index = 0; index < candidates.Count; index++)
        {
            ToxicCombinationCandidate candidate = candidates[index];
            SecurityEvidencePathInsertResult insertResult = insertResults[index];
            byte[] canonicalHash = SecurityEvidencePathCanonicalHash.ComputeSha256(pathWrites[index].Hops);

            PrivilegePathSeverityResult severity = ToxicCombinationSeverityTable.Resolve(candidate);

            SecurityEvidencePathRecord toxicPathHeader = pathWrites[index].Path;

            Dictionary<string, string?> metadata = new()
            {
                ["pathKind"] = PathKind.ToxicCombination.ToString(),
                ["pathConfidenceBand"] = toxicPathHeader.PathConfidenceBand.ToString(),
                ["reachabilityPathId"] = candidate.ReachabilityPathId.ToString("D"),
                ["privilegePathId"] = candidate.PrivilegePathId.ToString("D"),
                ["hasEgressHop"] = candidate.HasEgressHop.ToString(),
                ["hasInsufficientEvidenceHop"] = candidate.HasInsufficientEvidenceHop.ToString(),
                ["hopCount"] = candidate.Hops.Count.ToString(),
            };

            if (defenderSecureScoreBand != DefenderSecureScoreOrdinalBand.Unknown)
            {
                metadata[SecureNowArchitectConstants.DefenderSecureScoreBandMetadataKey] =
                    DefenderSecureScoreOrdinalBandMapper.ToMetadataValue(defenderSecureScoreBand);
            }

            ingestItems.Add(new OperationalSecurityFindingIngestItem
            {
                Provider = CloudProvider.Azure,
                SourceSystem = SecureNowArchitectConstants.SourceSystem,
                SourceFindingId = Convert.ToHexStringLower(canonicalHash),
                PathId = insertResult.PathId,
                CloudResourceId = candidate.TerminalCloudResourceId,
                ExternalResourceId = candidate.SharedAssetNodeId,
                ResourceType = candidate.TerminalResourceType,
                SubscriptionOrAccountId = snapshot.Header.SubscriptionId,
                ControlId = SecureNowArchitectConstants.ToxicCombinationControlId,
                ControlFramework = SecureNowArchitectConstants.SourceSystem,
                Title = ToxicCombinationPathNarrative.BuildTitle(candidate),
                Description = ToxicCombinationPathNarrative.BuildDescription(candidate),
                Severity = severity.Severity,
                BusinessCriticality = severity.BusinessCriticality,
                BlastRadius = severity.BlastRadius,
                Status = OperationalSecurityFindingStatus.Open,
                RawEvidenceReference = $"snapshot:{snapshotId:D}",
                Metadata = metadata,
            });
        }

        OperationalSecurityFindingBatchIngestResult ingestResult = await findingIngestService.IngestBatchAsync(
            scope,
            ingestItems,
            actorId,
            cancellationToken);

        await SecurityEvidencePathToxicSearchCoverageRecorder.ReplaceFromParentEnginesAsync(
            searchCoverageRepository,
            scope,
            snapshotId,
            candidates.Count,
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
