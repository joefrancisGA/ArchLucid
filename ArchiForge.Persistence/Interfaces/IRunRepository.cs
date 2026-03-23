using System.Data;

using ArchiForge.Core.Scoping;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Interfaces;

public interface IRunRepository
{
    Task SaveAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct);

    Task<IReadOnlyList<RunRecord>> ListByProjectAsync(ScopeContext scope, string projectId, int take, CancellationToken ct);

    Task UpdateAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);
}
