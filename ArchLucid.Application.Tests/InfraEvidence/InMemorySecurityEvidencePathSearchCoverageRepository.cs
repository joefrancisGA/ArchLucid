using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence;

internal sealed class InMemorySecurityEvidencePathSearchCoverageRepository : ISecurityEvidencePathSearchCoverageRepository
{
    private readonly List<SecurityEvidencePathSearchCoverageRecord> _rows = [];

    public Task ReplaceForEngineAsync(
        ScopeContext scope,
        Guid snapshotId,
        string engineName,
        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> rows,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(rows);

        _rows.RemoveAll(row =>
            row.TenantId == scope.TenantId
            && row.WorkspaceId == scope.WorkspaceId
            && row.ProjectId == scope.ProjectId
            && row.SnapshotId == snapshotId
            && string.Equals(row.EngineName, engineName, StringComparison.Ordinal));

        _rows.AddRange(rows);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<SecurityEvidencePathSearchCoverageRecord>> ListBySnapshotAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> matches = _rows
            .Where(row =>
                row.TenantId == scope.TenantId
                && row.WorkspaceId == scope.WorkspaceId
                && row.ProjectId == scope.ProjectId
                && row.SnapshotId == snapshotId)
            .ToList();

        return Task.FromResult(matches);
    }

    public IReadOnlyList<SecurityEvidencePathSearchCoverageRecord> AllRows => _rows;
}
