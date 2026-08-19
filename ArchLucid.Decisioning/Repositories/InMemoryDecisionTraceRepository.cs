using System.Data;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Decisioning.Repositories;

public class InMemoryDecisionTraceRepository : IDecisionTraceRepository
{
    private const int MaxEntries = 500;
    private readonly Lock _lock = new();

    private readonly List<DecisionTraceDto> _store = [];

    public Task SaveAsync(
        DecisionTraceDto trace,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(trace);

        if (trace is not RuleAuditTraceDto)
            throw new InvalidOperationException("Expected a RuleAudit trace (authority pipeline).");

        ct.ThrowIfCancellationRequested();
        _ = connection;
        _ = transaction;

        lock (_lock)
        {
            _store.Add(Clone(trace));

            if (_store.Count > MaxEntries)
                _store.RemoveRange(0, _store.Count - MaxEntries);
        }

        return Task.CompletedTask;
    }

    public Task<DecisionTraceDto?> GetByIdAsync(ScopeContext scope, Guid decisionTraceId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_lock)
        {
            DecisionTraceDto? result = _store.FirstOrDefault(x =>
                x is RuleAuditTraceDto rat &&
                rat.RuleAudit.DecisionTraceId == decisionTraceId &&
                rat.RuleAudit.TenantId == scope.TenantId &&
                rat.RuleAudit.WorkspaceId == scope.WorkspaceId &&
                rat.RuleAudit.ProjectId == scope.ProjectId);

            return Task.FromResult(result is null ? null : Clone(result));
        }
    }

    private static DecisionTraceDto Clone(DecisionTraceDto source)
    {
        string json = JsonSerializer.Serialize(source, ContractJson.Default);
        DecisionTraceDto? copy = JsonSerializer.Deserialize<DecisionTraceDto>(json, ContractJson.Default);

        return copy ?? throw new InvalidOperationException("Clone produced null DecisionTraceDto.");
    }
}
