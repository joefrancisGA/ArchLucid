using ArchLucid.Contracts.Agents;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory and test host: reference-case scores are not persisted.</summary>
public sealed class NoOpAgentOutputEvaluationResultRepository : IAgentOutputEvaluationResultRepository
{
    public Task AppendAsync(AgentOutputEvaluationResultInsert row, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(row);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }
}
