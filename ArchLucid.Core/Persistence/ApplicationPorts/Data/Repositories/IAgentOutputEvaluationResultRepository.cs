using ArchLucid.Contracts.Agents;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Append-only persistence for optional reference-case agent output scores.</summary>
public interface IAgentOutputEvaluationResultRepository
{
    Task AppendAsync(AgentOutputEvaluationResultInsert row, CancellationToken cancellationToken = default);
}
