using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecurityEvidencePathToxicSearchCoverageRecorder
{
    public static async Task ReplaceFromParentEnginesAsync(
        ISecurityEvidencePathSearchCoverageRepository repository,
        ScopeContext scope,
        Guid snapshotId,
        int toxicPathsEmitted,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(repository);
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> snapshotRows =
            await repository.ListBySnapshotAsync(scope, snapshotId, cancellationToken);

        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> parentRows = snapshotRows
            .Where(row => string.Equals(row.EngineName, SecurityEvidencePathSearchEngineNames.Privilege, StringComparison.Ordinal)
                || string.Equals(row.EngineName, SecurityEvidencePathSearchEngineNames.IntendedReachability, StringComparison.Ordinal))
            .ToList();

        List<SecurityEvidencePathSearchLimitHit> hits = [];

        if (parentRows.Count > 0)
        {
            foreach (SecurityEvidencePathSearchLimitKind kind in parentRows.Select(row => row.LimitKind).Distinct())
            {
                int minLimitValue = parentRows
                    .Where(row => row.LimitKind == kind)
                    .Min(row => row.LimitValue);

                hits.Add(new SecurityEvidencePathSearchLimitHit
                {
                    Kind = kind,
                    LimitValue = minLimitValue,
                    PathsEmitted = toxicPathsEmitted,
                });
            }
        }

        await SecurityEvidencePathSearchCoverageRecorder.ReplaceAsync(
            repository,
            scope,
            snapshotId,
            SecurityEvidencePathSearchEngineNames.ToxicCombination,
            hits,
            cancellationToken);
    }
}
