using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Thread-safe in-memory <see cref="ICoverageAssignmentRepository" /> for tests and no-SQL local runs.</summary>
public sealed class InMemoryCoverageAssignmentRepository : ICoverageAssignmentRepository
{
    private readonly Lock _gate = new();
    private readonly List<CoverageAssignment> _items = [];

    public Task AddAsync(CoverageAssignment assignment, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(assignment);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            _items.Add(CoverageAssignmentRepositoryCore.Clone(assignment));
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<CoverageAssignment>> ListByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<CoverageAssignment> list = CoverageAssignmentRepositoryCore
                .FilterByRunId(_items, runId)
                .Select(CoverageAssignmentRepositoryCore.Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<CoverageAssignment>>(list);
        }
    }

    public Task<IReadOnlyList<CoverageAssignment>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_gate)
        {
            List<CoverageAssignment> list = CoverageAssignmentRepositoryCore
                .FilterByScopeWithoutRun(_items, tenantId, workspaceId, projectId)
                .Select(CoverageAssignmentRepositoryCore.Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<CoverageAssignment>>(list);
        }
    }

}
