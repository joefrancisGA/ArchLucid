using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

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
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshotId,
            cancellationToken);

        if (ranks.Count == 0)
        {
            await cutPointRepository.ReplaceCutPointsForSnapshotAsync(scope.TenantId, snapshotId, [], cancellationToken);

            return new CutPointAnalysisEngineResult
            {
                Succeeded = true,
                CutPointsDiscovered = 0,
            };
        }

        Dictionary<Guid, string?> resourceTypesByCloudResourceId =
            await BuildResourceTypeLookupAsync(scope, snapshotId, cancellationToken);

        IReadOnlyList<RemediationPatternApprovedVersionRecord> approvedPatterns =
            await remediationPatternRepository.ListApprovedVersionsForTenantAsync(scope.TenantId, cancellationToken);

        List<(SecurityEvidencePathRecord Path, IReadOnlyList<SecurityEvidencePathHopRecord> Hops)> rankedPaths = [];

        foreach (SecurityEvidencePathRankRecord rank in ranks)
        {
            SecurityEvidencePathRecord? path =
                await pathRepository.TryGetByIdAsync(scope.TenantId, rank.PathId, cancellationToken);

            if (path is null)
            {
                continue;
            }

            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathAsync(scope.TenantId, rank.PathId, cancellationToken);

            rankedPaths.Add((path, hops));
        }

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
            await cutPointRepository.ReplaceCutPointsForSnapshotAsync(
                scope.TenantId,
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

    private async Task<Dictionary<Guid, string?>> BuildResourceTypeLookupAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        AzureInventorySnapshotDetailReadModel? snapshot =
            await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

        if (snapshot is null)
        {
            return [];
        }

        return snapshot.Resources
            .Where(resource => resource.CloudResourceId is not null && resource.CloudResourceId != Guid.Empty)
            .GroupBy(resource => resource.CloudResourceId!.Value)
            .ToDictionary(
                group => group.Key,
                group => (string?)group.First().ResourceType);
    }

    private static CutPointAnalysisEngineResult Failed(string message) =>
        new()
        {
            Succeeded = false,
            ErrorMessage = message,
        };
}
