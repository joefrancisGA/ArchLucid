using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class PrivilegePathEngine(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    IOperationalSecurityFindingIngestService findingIngestService,
    ILogger<PrivilegePathEngine> logger) : IPrivilegePathEngine
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

        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return Failed("Snapshot was not found in the current tenant scope.");
        }

        InventoryPrivilegePathGraphSnapshot graph = InventoryPrivilegePathGraph.Build(snapshot);
        IReadOnlyList<PrivilegePathCandidate> candidates =
            PrivilegePathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        if (runScope is { IsFullEstate: false })
        {
            IReadOnlyDictionary<string, Guid> cloudResourceIdByArmId =
                SecureNowArchitectNeighborhoodFilter.BuildCloudResourceIdByArmId(snapshot);

            candidates = candidates
                .Where(candidate => SecureNowArchitectNeighborhoodFilter.CandidateTouchesSeeds(
                    candidate,
                    runScope.SeedCloudResourceIds,
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
        int pathsPersisted = 0;

        foreach (PrivilegePathCandidate candidate in candidates)
        {
            Guid pathId = Guid.NewGuid();
            IReadOnlyList<SecurityEvidencePathHopRecord> hopRecords =
                PrivilegePathMaterializer.BuildHopRecords(scope.TenantId, pathId, snapshotId, candidate.Hops);

            SecurityEvidencePathRecord header = new()
            {
                PathId = pathId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = snapshotId,
                PathKind = PathKind.Privilege,
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
                logger.LogWarning(ex, "Privilege path persist failed for SnapshotId={SnapshotId}.", snapshotId);

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

            PrivilegePathSeverityResult severity = PrivilegePathSeverityTable.Resolve(
                candidate.EffectiveRoleName,
                candidate.HasInsufficientEvidenceHop,
                candidate.ScopeTaggedProduction);

            ingestItems.Add(new OperationalSecurityFindingIngestItem
            {
                Provider = CloudProvider.Azure,
                SourceSystem = SecureNowArchitectConstants.SourceSystem,
                SourceFindingId = Convert.ToHexStringLower(canonicalHash),
                PathId = insertResult.PathId,
                CloudResourceId = candidate.TerminalCloudResourceId,
                ExternalResourceId = candidate.TerminalScopeNodeId,
                ResourceType = candidate.TerminalResourceType,
                SubscriptionOrAccountId = snapshot.Header.SubscriptionId,
                ControlId = SecureNowArchitectConstants.PrivilegePathControlId,
                ControlFramework = SecureNowArchitectConstants.SourceSystem,
                Title = PrivilegePathNarrative.BuildTitle(candidate),
                Description = PrivilegePathNarrative.BuildDescription(candidate),
                Severity = severity.Severity,
                BusinessCriticality = severity.BusinessCriticality,
                BlastRadius = severity.BlastRadius,
                Status = OperationalSecurityFindingStatus.Open,
                RawEvidenceReference = $"snapshot:{snapshotId:D}",
                Metadata = new Dictionary<string, string?>
                {
                    ["pathKind"] = PathKind.Privilege.ToString(),
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
