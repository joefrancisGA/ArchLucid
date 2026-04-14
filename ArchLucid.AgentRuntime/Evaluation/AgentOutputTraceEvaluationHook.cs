using ArchLucid.Contracts.Agents;

namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
/// Delegates to <see cref="AgentOutputEvaluationRecorder"/> so structural/semantic metrics are recorded after execute completes.
/// </summary>
public sealed class AgentOutputTraceEvaluationHook(AgentOutputEvaluationRecorder recorder) : IAgentOutputTraceEvaluationHook
{
    private readonly AgentOutputEvaluationRecorder _recorder =
        recorder ?? throw new ArgumentNullException(nameof(recorder));

    /// <inheritdoc />
    public Task AfterSuccessfulExecuteAsync(string runId, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return _recorder.EvaluateAndRecordMetricsAsync(runId, cancellationToken);
    }
}
