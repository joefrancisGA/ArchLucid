using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class InMemoryDecisionNodeRepository : IDecisionNodeRepository
{
    private readonly Dictionary<string, List<DecisionNodeRecord>> _byRunId = new(StringComparer.Ordinal);
    private readonly Lock _gate = new();

    public Task CreateManyAsync(
        IReadOnlyCollection<DecisionNodeRecord> decisions,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(decisions);
        cancellationToken.ThrowIfCancellationRequested();

        if (decisions.Count == 0)
            return Task.CompletedTask;

        lock (_gate)

            foreach (DecisionNodeRecord decision in decisions)
            {
                if (!_byRunId.TryGetValue(decision.RunId, out List<DecisionNodeRecord>? list))
                {
                    list = [];
                    _byRunId[decision.RunId] = list;
                }

                list.Add(Clone(decision));
            }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<DecisionNodeRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        lock (_gate)
        {
            if (!_byRunId.TryGetValue(runId, out List<DecisionNodeRecord>? list))
                return Task.FromResult<IReadOnlyList<DecisionNodeRecord>>([]);

            List<DecisionNodeRecord> ordered = list
                .OrderBy(d => d.CreatedUtc)
                .Select(Clone)
                .ToList();

            return Task.FromResult<IReadOnlyList<DecisionNodeRecord>>(ordered);
        }
    }

    private static DecisionNodeRecord Clone(DecisionNodeRecord source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        DecisionNodeRecord? copy = JsonSerializer.Deserialize<DecisionNodeRecord>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null DecisionNodeRecord.");
    }
}
