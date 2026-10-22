
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Advisory;

/// <summary>
/// Thread-safe in-memory <see cref="IAdvisoryScanExecutionRepository"/> for tests and storage-off mode.
/// </summary>
public sealed class InMemoryAdvisoryScanExecutionRepository : IAdvisoryScanExecutionRepository
{
    private readonly List<AdvisoryScanExecution> _items = [];
    private readonly Lock _gate = new();

    /// <inheritdoc />
    public Task CreateAsync(AdvisoryScanExecution execution, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
            _items.Add(execution);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct)
    {
        _ = ct;
        lock (_gate)
        {
            int i = _items.FindIndex(x => x.ExecutionId == execution.ExecutionId && SameScope(x, execution));
            if (i >= 0)
                _items[i] = execution;
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AdvisoryScanExecution>> ListByScheduleAsync(
        ScopeContext scope,
        Guid scheduleId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = ct;
        lock (_gate)
        {
            List<AdvisoryScanExecution> result = _items
                .Where(x => x.ScheduleId == scheduleId && MatchesScope(x, scope))
                .OrderByDescending(x => x.StartedUtc)
                .Take(take)
                .ToList();

            return Task.FromResult<IReadOnlyList<AdvisoryScanExecution>>(result);
        }
    }

    private static bool MatchesScope(AdvisoryScanExecution execution, ScopeContext scope) =>
        execution.TenantId == scope.TenantId &&
        execution.WorkspaceId == scope.WorkspaceId &&
        execution.ProjectId == scope.ProjectId;

    private static bool SameScope(AdvisoryScanExecution stored, AdvisoryScanExecution incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
