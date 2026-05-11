using ArchLucid.AgentRuntime;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

/// <summary>
///     Light-weight trace recorder that sums provider token usage for drift-run budgeting (no SQL persistence).
/// </summary>
internal sealed class GoldenCohortDriftTokenRecorder : IAgentExecutionTraceRecorder
{
    public int InputTokensTotal
    {
        get;
        private set;
    }

    public int OutputTokensTotal
    {
        get;
        private set;
    }

    public int TotalPromptCompletionTokens => InputTokensTotal + OutputTokensTotal;

    public Task RecordAsync(
        string runId,
        string taskId,
        AgentType agentType,
        string systemPrompt,
        string userPrompt,
        string rawResponse,
        string? parsedResultJson,
        bool parseSucceeded,
        string? errorMessage,
        AgentPromptReproMetadata? promptRepro = null,
        int? inputTokenCount = null,
        int? outputTokenCount = null,
        int? reasoningTokenCount = null,
        string? modelDeploymentName = null,
        string? modelVersion = null,
        bool isSimulatorExecution = false,
        string? failureReasonCode = null,
        CancellationToken cancellationToken = default)
    {
        _ = runId;
        _ = taskId;
        _ = agentType;
        _ = systemPrompt;
        _ = userPrompt;
        _ = rawResponse;
        _ = parsedResultJson;
        _ = parseSucceeded;
        _ = errorMessage;
        _ = promptRepro;
        _ = reasoningTokenCount;
        _ = modelDeploymentName;
        _ = modelVersion;
        _ = isSimulatorExecution;
        _ = failureReasonCode;
        _ = cancellationToken;

        if (inputTokenCount is { } ip and > 0)
            InputTokensTotal += ip;

        if (outputTokenCount is { } op and > 0)
            OutputTokensTotal += op;

        return Task.CompletedTask;
    }
}
