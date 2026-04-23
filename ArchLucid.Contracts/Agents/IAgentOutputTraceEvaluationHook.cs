namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Runs after coordinator execute successfully persists agent outputs so trace-based observability (metrics, etc.) can
///     run outside the execute transaction.
/// </summary>
public interface IAgentOutputTraceEvaluationHook
{
    /// <summary>Called once the execute phase has committed evidence, results, and evaluations for <paramref name="runId" />.</summary>
    Task AfterSuccessfulExecuteAsync(string runId, CancellationToken cancellationToken);
}
