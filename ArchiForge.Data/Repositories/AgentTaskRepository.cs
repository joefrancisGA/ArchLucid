using ArchiForge.Contracts.Agents;
using ArchiForge.Contracts.Common;
using ArchiForge.Data.Infrastructure;

using Dapper;

namespace ArchiForge.Data.Repositories;

/// <summary>
/// Dapper-backed persistence for <see cref="AgentTask"/> entities.
/// </summary>
public sealed class AgentTaskRepository(IDbConnectionFactory connectionFactory) : IAgentTaskRepository
{
    public async Task CreateManyAsync(IEnumerable<AgentTask> tasks, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(tasks);

        const string sql = """
            INSERT INTO AgentTasks
            (
                TaskId,
                RunId,
                AgentType,
                Objective,
                Status,
                CreatedUtc,
                CompletedUtc,
                EvidenceBundleRef
            )
            VALUES
            (
                @TaskId,
                @RunId,
                @AgentType,
                @Objective,
                @Status,
                @CreatedUtc,
                @CompletedUtc,
                @EvidenceBundleRef
            );
            """;

        using var connection = connectionFactory.CreateConnection();
        using var transaction = connection.BeginTransaction();

        var rows = tasks.Select(t => new
        {
            t.TaskId,
            t.RunId,
            AgentType = t.AgentType.ToString(),
            t.Objective,
            Status = t.Status.ToString(),
            t.CreatedUtc,
            t.CompletedUtc,
            t.EvidenceBundleRef
        });

        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            rows,
            transaction: transaction,
            cancellationToken: cancellationToken));

        transaction.Commit();
    }

    public async Task<IReadOnlyList<AgentTask>> GetByRunIdAsync(string runId, CancellationToken cancellationToken = default)
    {
        const string sql = """
            SELECT
                TaskId,
                RunId,
                AgentType,
                Objective,
                Status,
                CreatedUtc,
                CompletedUtc,
                EvidenceBundleRef
            FROM AgentTasks
            WHERE RunId = @RunId
            ORDER BY CreatedUtc
            LIMIT 500;
            """;

        using var connection = connectionFactory.CreateConnection();

        var rows = await connection.QueryAsync<AgentTaskRow>(new CommandDefinition(
            sql,
            new { RunId = runId },
            cancellationToken: cancellationToken));

        return [.. rows.Select(r => new AgentTask
        {
            TaskId = r.TaskId,
            RunId = r.RunId,
            AgentType = Enum.TryParse<AgentType>(r.AgentType, true, out var agentType)
                ? agentType
                : throw new InvalidOperationException($"Unknown AgentType '{r.AgentType}' for task '{r.TaskId}'."),
            Objective = r.Objective,
            Status = Enum.TryParse<AgentTaskStatus>(r.Status, true, out var status)
                ? status
                : throw new InvalidOperationException($"Unknown AgentTaskStatus '{r.Status}' for task '{r.TaskId}'."),
            CreatedUtc = r.CreatedUtc,
            CompletedUtc = r.CompletedUtc,
            EvidenceBundleRef = r.EvidenceBundleRef
        })];
    }

    private sealed class AgentTaskRow
    {
        public string TaskId { get; init; } = string.Empty;
        public string RunId { get; init; } = string.Empty;
        public string AgentType { get; init; } = string.Empty;
        public string Objective { get; init; } = string.Empty;
        public string Status { get; init; } = string.Empty;
        public DateTime CreatedUtc { get; init; }
        public DateTime? CompletedUtc { get; init; }
        public string? EvidenceBundleRef { get; init; }
    }
}
