using System.Data;
using ArchiForge.Core.Scoping;
using ArchiForge.Decisioning.Models;

namespace ArchiForge.Decisioning.Interfaces;

public interface IDecisionTraceRepository
{
    Task SaveAsync(
        DecisionTrace trace,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<DecisionTrace?> GetByIdAsync(ScopeContext scope, Guid decisionTraceId, CancellationToken ct);
}

