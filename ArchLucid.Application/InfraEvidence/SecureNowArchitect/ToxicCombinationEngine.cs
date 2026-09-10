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
    ILogger<ToxicCombinationEngine> logger) : IToxicCombinationEngine
{
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

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return Failed("Snapshot was not found in the current tenant scope.");
        }

        IReadOnlyList<ToxicCombinationPathSnapshot> reachabilityPaths =
            await ToxicCombinationPathLoader.LoadSnapshotsAsync(
                pathRepository,
                scope,
                snapshotId,
                PathKind.IntendedReachability,
                snapshot,
                cancellationToken);

        IReadOnlyList<ToxicCombinationPathSnapshot> privilegePaths =
            await ToxicCombinationPathLoader.LoadSnapshotsAsync(
                pathRepository,
                scope,
                snapshotId,
                PathKind.Privilege,
                snapshot,
                cancellationToken);

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

        IReadOnlyList<ToxicCombinationCandidate> candidates = ToxicCombinationPathComposer.Compose(
            reachabilityPaths,
            privilegePaths,
            egressBySubnetArmId);

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
                logger.LogWarning(ex, "Toxic combination path persist failed for SnapshotId={SnapshotId}.", snapshotId);

                continue;
            }

            if (insertResult.Created)
            {
                pathsPersisted++;
            }

            SecurityEvidencePathRecord? persisted = await pathRepository.TryGetByIdAsync(
                scope.TenantId,
                insertResult.PathId,
                cancellationToken);

            byte[] canonicalHash = persisted?.CanonicalHopHashSha256
                                   ?? SecurityEvidencePathCanonicalHash.ComputeSha256(hopRecords);

            PrivilegePathSeverityResult severity = ToxicCombinationSeverityTable.Resolve(candidate);

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
                Metadata = new Dictionary<string, string?>
                {
                    ["pathKind"] = PathKind.ToxicCombination.ToString(),
                    ["reachabilityPathId"] = candidate.ReachabilityPathId.ToString("D"),
                    ["privilegePathId"] = candidate.PrivilegePathId.ToString("D"),
                    ["hasEgressHop"] = candidate.HasEgressHop.ToString(),
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
