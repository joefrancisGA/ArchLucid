
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
        ct.ThrowIfCancellationRequested();
        lock (_gate)
            _items.Add(Copy(execution));
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task UpdateAsync(AdvisoryScanExecution execution, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AdvisoryScanExecution? stored = _items.Find(x =>
                x.ExecutionId == execution.ExecutionId && SameScope(x, execution));
            if (stored is not null)
            {
                stored.CompletedUtc = execution.CompletedUtc;
                stored.Status = execution.Status;
                stored.ResultJson = execution.ResultJson;
                stored.ErrorMessage = execution.ErrorMessage;
            }
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task MarkFailedIfStartedAsync(
        ScopeContext scope,
        Guid executionId,
        DateTime completedUtc,
        string errorMessage,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            AdvisoryScanExecution? execution = _items.Find(x =>
                x.ExecutionId == executionId && MatchesScope(x, scope) &&
                string.Equals(x.Status, "Started", StringComparison.OrdinalIgnoreCase));
            if (execution is not null)
            {
                execution.Status = "Failed";
                execution.CompletedUtc = completedUtc;
                execution.ErrorMessage = errorMessage;
            }
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
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AdvisoryScanExecution> result = _items
                .Where(x => x.ScheduleId == scheduleId && MatchesScope(x, scope))
                .OrderByDescending(x => x.StartedUtc)
                .Take(Math.Clamp(take, 1, 200))
                .Select(static execution =>
                {
                    AdvisoryScanExecution summary = Copy(execution);
                    summary.ResultJson = string.Empty;
                    return summary;
                })
                .ToList();

            return Task.FromResult<IReadOnlyList<AdvisoryScanExecution>>(result);
        }
    }

    private static AdvisoryScanExecution Copy(AdvisoryScanExecution execution) => new()
    {
        ExecutionId = execution.ExecutionId,
        ScheduleId = execution.ScheduleId,
        TenantId = execution.TenantId,
        WorkspaceId = execution.WorkspaceId,
        ProjectId = execution.ProjectId,
        StartedUtc = execution.StartedUtc,
        CompletedUtc = execution.CompletedUtc,
        Status = execution.Status,
        ResultJson = execution.ResultJson,
        ErrorMessage = execution.ErrorMessage,
    };

    private static bool MatchesScope(AdvisoryScanExecution execution, ScopeContext scope) =>
        execution.TenantId == scope.TenantId &&
        execution.WorkspaceId == scope.WorkspaceId &&
        execution.ProjectId == scope.ProjectId;

    private static bool SameScope(AdvisoryScanExecution stored, AdvisoryScanExecution incoming) =>
        stored.TenantId == incoming.TenantId &&
        stored.WorkspaceId == incoming.WorkspaceId &&
        stored.ProjectId == incoming.ProjectId;
}
