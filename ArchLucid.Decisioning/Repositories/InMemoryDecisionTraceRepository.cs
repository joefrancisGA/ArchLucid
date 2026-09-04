using System.Data;

using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Decisioning.Repositories;

public class InMemoryDecisionTraceRepository : IDecisionTraceRepository
{
    private readonly Lock _lock = new();

    private readonly List<DecisionTraceDto> _store = [];

    public Task SaveAsync(
        DecisionTraceDto trace,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        DecisionTraceStoreRules.RequireRuleAudit(trace);

        ct.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        lock (_lock)
        {
            _store.Add(DecisionTraceStoreRules.Clone(trace));
            DecisionTraceStoreRules.TrimInMemoryEntries(_store);
        }

        return Task.CompletedTask;
    }

    public Task<DecisionTraceDto?> GetByIdAsync(ScopeContext scope, Guid decisionTraceId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_lock)
        {
            DecisionTraceDto? result = _store.FirstOrDefault(trace =>
                trace is RuleAuditTraceDto ruleAuditTrace
                && DecisionTraceStoreRules.MatchesIdAndScope(ruleAuditTrace, scope, decisionTraceId));

            return Task.FromResult(result is null ? null : DecisionTraceStoreRules.Clone(result));
        }
    }
}
