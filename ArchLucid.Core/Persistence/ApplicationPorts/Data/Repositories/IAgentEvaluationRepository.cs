using System.Data;

using ArchLucid.Contracts.Persistence.Decisions;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IAgentEvaluationRepository
{
    Task CreateManyAsync(
        IReadOnlyCollection<AgentEvaluationRecord> evaluations,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<IReadOnlyList<AgentEvaluationRecord>> GetByRunIdAsync(
        string runId,
        CancellationToken cancellationToken = default);
}
