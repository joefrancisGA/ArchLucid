using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SecurityEvidencePathSearchCoverageRecorder
{
    public static Task ReplaceAsync(
        ISecurityEvidencePathSearchCoverageRepository repository,
        ScopeContext scope,
        Guid snapshotId,
        string engineName,
        IReadOnlyList<SecurityEvidencePathSearchLimitHit> hits,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(repository);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(hits);

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();
        List<SecurityEvidencePathSearchCoverageRecord> rows = [];

        foreach (SecurityEvidencePathSearchLimitHit hit in hits)
        {
            rows.Add(new SecurityEvidencePathSearchCoverageRecord
            {
                SearchCoverageId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                SnapshotId = snapshotId,
                EngineName = engineName,
                LimitKind = hit.Kind,
                LimitValue = hit.LimitValue,
                PathsEmitted = hit.PathsEmitted,
                CreatedUtc = createdUtc,
            });
        }

        return repository.ReplaceForEngineAsync(scope, snapshotId, engineName, rows, cancellationToken);
    }
}
