using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class InMemoryRunRepository
{
    /// <inheritdoc />
    public Task<IReadOnlyList<RunRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return Task.FromResult<IReadOnlyList<RunRecord>>([]);

        List<RunRecord> runs = _store.Values
            .Where(run =>
                RunRepositoryCore.IsActiveInScope(run, scope)
                && run.ArchitectureId == architectureId)
            .OrderByDescending(run => run.CreatedUtc)
            .ThenByDescending(run => run.RunId)
            .ToList();

        return Task.FromResult<IReadOnlyList<RunRecord>>(runs);
    }

    /// <inheritdoc />
    public Task<int> CountByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);

        if (architectureId == Guid.Empty)
            return Task.FromResult(0);

        int count = _store.Values.Count(run =>
            RunRepositoryCore.IsActiveInScope(run, scope)
            && run.ArchitectureId == architectureId);

        return Task.FromResult(count);
    }
}
