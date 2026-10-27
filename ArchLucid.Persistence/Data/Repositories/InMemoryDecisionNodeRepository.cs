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
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        lock (_gate)
        {
            Dictionary<string, DecisionNodeRecord> merged = new(StringComparer.OrdinalIgnoreCase);

            foreach (string lookupKey in TechnologyLedgerRunIdLookup.EnumerateRunIdRepositoryLookupKeys(runId))
            {
                if (!_byRunId.TryGetValue(lookupKey, out List<DecisionNodeRecord>? list))
                    continue;

                foreach (DecisionNodeRecord decision in list.OrderBy(d => d.CreatedUtc))
                {
                    string mergeKey = string.IsNullOrWhiteSpace(decision.DecisionId)
                        ? $"{decision.Topic}:{decision.RunId}"
                        : decision.DecisionId;

                    if (!merged.TryGetValue(mergeKey, out DecisionNodeRecord? existing)
                        || decision.CreatedUtc > existing.CreatedUtc)
                    {
                        merged[mergeKey] = decision;
                    }
                }
            }

            List<DecisionNodeRecord> ordered = merged.Values
                .OrderBy(d => d.CreatedUtc)
                .ThenBy(d => d.DecisionId, StringComparer.OrdinalIgnoreCase)
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
