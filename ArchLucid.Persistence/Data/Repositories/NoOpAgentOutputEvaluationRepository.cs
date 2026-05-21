namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>No-op when SQL evaluation persistence is unavailable.</summary>
public sealed class NoOpAgentOutputEvaluationRepository : IAgentOutputEvaluationRepository
{
    public Task AppendAsync(AgentOutputEvaluationInsert row, CancellationToken cancellationToken = default)
    {
        _ = row;
        return Task.CompletedTask;
    }
}
