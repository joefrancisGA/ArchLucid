using System.Data;

using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>
///     Thread-safe in-memory <see cref="IAgentTaskRepository" /> for tests.
/// </summary>
public sealed class InMemoryAgentTaskRepository : IAgentTaskRepository
{
    private readonly Lock _gate = new();
    private readonly List<AgentTask> _tasks = [];

    /// <inheritdoc />
    public Task CreateManyAsync(
        IEnumerable<AgentTask> tasks,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(tasks);
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)

            foreach (AgentTask task in tasks)

                _tasks.Add(task);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<AgentTask>> GetByRunIdAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken = default)
    {
        _ = scope;
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            List<AgentTask> list = _tasks
                .Where(t => string.Equals(t.RunId, runId, StringComparison.Ordinal))
                .OrderBy(t => t.CreatedUtc)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentTask>>(list);
        }
    }
}
