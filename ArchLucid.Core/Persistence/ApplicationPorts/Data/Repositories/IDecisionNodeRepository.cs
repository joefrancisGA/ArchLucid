using System.Data;

using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IDecisionNodeRepository
{
    Task CreateManyAsync(
        IReadOnlyCollection<DecisionNodeRecord> decisions,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<IReadOnlyList<DecisionNodeRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default);
}
