using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class CutPointAnalysisEngine(
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRankRepository rankRepository,
    ISecurityEvidenceCutPointRepository cutPointRepository,
    IAzureInventorySnapshotRepository snapshotRepository,
    IRemediationPatternRepository remediationPatternRepository,
    ILogger<CutPointAnalysisEngine> logger) : ICutPointAnalysisEngine
{
    public async Task<CutPointAnalysisEngineResult> RunAsync(
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

        IReadOnlyList<SecurityEvidencePathRankRecord> ranks = await rankRepository.ListBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId),
            cancellationToken);

        if (ranks.Count == 0)
        {
            await cutPointRepository.ReplaceCutPointsForSnapshotInScopeAsync(scope.ToProjectScopeKey(), snapshotId, [], cancellationToken);

            return new CutPointAnalysisEngineResult
            {
                Succeeded = true,
                CutPointsDiscovered = 0,
            };
        }

        IReadOnlyDictionary<Guid, string?> resourceTypesByCloudResourceId =
            await BuildResourceTypeLookupAsync(scope, snapshotId, cancellationToken);

        IReadOnlyList<RemediationPatternApprovedVersionRecord> approvedPatterns =
            await remediationPatternRepository.ListApprovedVersionsForTenantAsync(scope.TenantId, cancellationToken);

        List<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> rankedPaths = [];

        IReadOnlyList<SecurityEvidencePathWithHops> paths = await pathRepository.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId), cancellationToken);
        Dictionary<Guid, SecurityEvidencePathWithHops> pathsById = paths.ToDictionary(item => item.Path.PathId);
        foreach (SecurityEvidencePathRankRecord rank in ranks)
            if (pathsById.TryGetValue(rank.PathId, out SecurityEvidencePathWithHops? item))
                rankedPaths.Add((item.Path, item.Hops));

        IReadOnlyList<SecurityEvidenceCutPointCandidate> candidates =
            SecurityEvidenceCutPointAnalyzer.Analyze(rankedPaths, resourceTypesByCloudResourceId);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        List<SecurityEvidenceCutPointRecord> records = [];
        int cutOrder = 1;

        foreach (SecurityEvidenceCutPointCandidate candidate in candidates)
        {
            string? suggestedPatternKey =
                SecurityEvidenceCutPointPatternSuggester.TrySuggestPatternKey(candidate, approvedPatterns);

            records.Add(SecurityEvidenceCutPointAnalyzer.ToRecord(
                candidate,
                scope.TenantId,
                snapshotId,
                cutOrder++,
                utcNow,
                suggestedPatternKey));
        }

        try
        {
            await cutPointRepository.ReplaceCutPointsForSnapshotInScopeAsync(
                scope.ToProjectScopeKey(),
                snapshotId,
                records,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Cut-point persist failed for SnapshotId={SnapshotId}.", snapshotId);

            return Failed("Cut-point persist failed.");
        }

        return new CutPointAnalysisEngineResult
        {
            Succeeded = true,
            CutPointsDiscovered = records.Count,
        };
    }

    private async Task<IReadOnlyDictionary<Guid, string?>> BuildResourceTypeLookupAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AzureInventoryResourceRecord>? resources =
            await snapshotRepository.ListResourcesBySnapshotIdAsync(scope, snapshotId, cancellationToken);

        if (resources is null)
        {
            return new Dictionary<Guid, string?>();
        }

        Dictionary<Guid, string?> lookup = new();

        foreach (AzureInventoryResourceRecord resource in resources)
        {
            if (resource.CloudResourceId is not Guid cloudResourceId || cloudResourceId == Guid.Empty)
            {
                continue;
            }

            lookup[cloudResourceId] = resource.ResourceType;
        }

        return lookup;
    }

    private static CutPointAnalysisEngineResult Failed(string message) =>
        new()
        {
            Succeeded = false,
            ErrorMessage = message,
        };
}
