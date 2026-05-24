using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class InMemoryAgentEvaluationRepository : IAgentEvaluationRepository
{
    private readonly Dictionary<string, List<AgentEvaluationRecord>> _byRunId = new(StringComparer.Ordinal);
    private readonly Lock _gate = new();

    public Task CreateManyAsync(
        IReadOnlyCollection<AgentEvaluationRecord> evaluations,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(evaluations);
        cancellationToken.ThrowIfCancellationRequested();

        if (evaluations.Count == 0)
            return Task.CompletedTask;

        List<string> distinctRunIds = evaluations.Select(e => e.RunId).Distinct().ToList();
        if (distinctRunIds.Count > 1)

            throw new ArgumentException(
                $"All evaluations in a batch must belong to the same run. Found distinct RunIds: {string.Join(", ", distinctRunIds)}.",
                nameof(evaluations));

        string runId = evaluations.First().RunId;

        lock (_gate)

            _byRunId[runId] = evaluations.Select(Clone).ToList();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<AgentEvaluationRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (!_byRunId.TryGetValue(runId, out List<AgentEvaluationRecord>? list))
                return Task.FromResult<IReadOnlyList<AgentEvaluationRecord>>([]);

            List<AgentEvaluationRecord> ordered = list
                .OrderBy(e => e.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<AgentEvaluationRecord>>(ordered);
        }
    }

    private static AgentEvaluationRecord Clone(AgentEvaluationRecord source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        AgentEvaluationRecord? copy = JsonSerializer.Deserialize<AgentEvaluationRecord>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null AgentEvaluationRecord.");
    }
}
