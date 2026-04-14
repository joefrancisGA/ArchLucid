namespace ArchLucid.Contracts.Agents;

/// <summary>Test and default no-op implementation of <see cref="IAgentOutputTraceEvaluationHook"/>.</summary>
public sealed class NoOpAgentOutputTraceEvaluationHook : IAgentOutputTraceEvaluationHook
{
    /// <inheritdoc />
    public Task AfterSuccessfulExecuteAsync(string runId, CancellationToken cancellationToken) => Task.CompletedTask;
}
