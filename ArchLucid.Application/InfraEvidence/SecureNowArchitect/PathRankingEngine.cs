using ArchLucid.Application.InfraEvidence.SecurityAssetAssertions;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

public sealed class PathRankingEngine(
    ISecurityEvidencePathRepository pathRepository,
    ISecurityEvidencePathRankRepository rankRepository,
    ISecurityAssetAssertionResolver assertionResolver,
    ILogger<PathRankingEngine> logger) : IPathRankingEngine
{
    public async Task<PathRankingEngineResult> RunAsync(
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

        IReadOnlyList<SecurityEvidencePathRecord> paths = await pathRepository.ListBySnapshotAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshotId,
            cancellationToken);

        if (paths.Count == 0)
        {
            await rankRepository.ReplaceRanksForSnapshotAsync(scope.TenantId, snapshotId, [], cancellationToken);

            return new PathRankingEngineResult
            {
                Succeeded = true,
                PathsRanked = 0,
            };
        }

        SecurityEvidencePathRankWeightsRecord? storedWeights =
            await rankRepository.TryGetWeightsAsync(scope.TenantId, cancellationToken);

        IReadOnlyDictionary<SecurityEvidencePathRankDimension, decimal> weights =
            SecurityEvidencePathRankCalculator.ParseWeightsJson(storedWeights?.WeightsJson);

        DateTime utcNow = TimeProvider.System.UtcNowDateTime();
        IReadOnlySet<Guid> activeCrownJewelAssertionIds =
            await assertionResolver.GetActiveCrownJewelAssertionIdsAsync(scope.TenantId, utcNow, cancellationToken);

        List<(SecurityEvidencePathRecord Path, SecurityEvidencePathRankEvaluation Evaluation)> evaluated = [];

        foreach (SecurityEvidencePathRecord path in paths)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathAsync(scope.TenantId, path.PathId, cancellationToken);

            SecurityEvidencePathRankEvaluation evaluation =
                SecurityEvidencePathRankCalculator.Evaluate(path, hops, weights, activeCrownJewelAssertionIds);

            evaluated.Add((path, evaluation));
        }

        List<(SecurityEvidencePathRecord Path, SecurityEvidencePathRankEvaluation Evaluation)> ordered = evaluated
            .OrderByDescending(item => item.Evaluation.CompositeSortScore)
            .ThenByDescending(item => item.Evaluation.TechnicalExposureScore)
            .ThenByDescending(item => item.Evaluation.ConfidenceBandScore)
            .ThenBy(item => item.Path.PathId)
            .ToList();

        List<SecurityEvidencePathRankRecord> rankRecords = [];
        int rankOrder = 1;

        foreach ((SecurityEvidencePathRecord path, SecurityEvidencePathRankEvaluation evaluation) in ordered)
        {
            rankRecords.Add(new SecurityEvidencePathRankRecord
            {
                PathId = path.PathId,
                TenantId = scope.TenantId,
                SnapshotId = snapshotId,
                RuleVersion = SecurityEvidencePathRankConstants.RuleVersion,
                TechnicalExposureScore = evaluation.TechnicalExposureScore,
                PrivilegeDepthScore = evaluation.PrivilegeDepthScore,
                BlastRadiusScore = evaluation.BlastRadiusScore,
                BusinessConsequenceScore = evaluation.BusinessConsequenceScore,
                ConfidenceBandScore = evaluation.ConfidenceBandScore,
                CompositeSortScore = evaluation.CompositeSortScore,
                RankOrder = rankOrder++,
                ExplanationSummary = evaluation.ExplanationSummary,
                BreakdownJson = evaluation.BreakdownJson,
                ComputedUtc = utcNow,
            });
        }

        try
        {
            await rankRepository.ReplaceRanksForSnapshotAsync(
                scope.TenantId,
                snapshotId,
                rankRecords,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Path ranking persist failed for SnapshotId={SnapshotId}.", snapshotId);

            return Failed("Path ranking persist failed.");
        }

        return new PathRankingEngineResult
        {
            Succeeded = true,
            PathsRanked = rankRecords.Count,
        };
    }

    private static PathRankingEngineResult Failed(string message) =>
        new()
        {
            Succeeded = false,
            ErrorMessage = message,
        };
}
