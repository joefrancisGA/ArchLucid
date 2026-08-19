using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>Captures the most recent <see cref="IAgentExecutionTraceRecorder.RecordAsync" /> invocation for assertions.</summary>
public sealed class CapturingAgentExecutionTraceRecorder : IAgentExecutionTraceRecorder
{
    public sealed record CapturedTraceCall(
        string RunId,
        string TaskId,
        AgentType AgentType,
        string SystemPrompt,
        string UserPrompt,
        string RawResponse,
        string? ParsedResultJson,
        bool ParseSucceeded,
        string? ErrorMessage,
        AgentPromptReproMetadata? PromptRepro,
        int? InputTokenCount,
        int? OutputTokenCount,
        int? ReasoningTokenCount,
        string? ModelDeploymentName,
        string? ModelVersion,
        bool IsSimulatorExecution,
        string? FailureReasonCode,
        int AttemptIndex);

    public CapturedTraceCall? LastCall { get; private set; }

    public int CallCount { get; private set; }

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
        float? completionTemperature = null,
        int? maxCompletionTokens = null,
        float? completionTopP = null,
        int attemptIndex = 0,
        CancellationToken cancellationToken = default)
    {
        CallCount++;
        LastCall = new CapturedTraceCall(
            runId,
            taskId,
            agentType,
            systemPrompt,
            userPrompt,
            rawResponse,
            parsedResultJson,
            parseSucceeded,
            errorMessage,
            promptRepro,
            inputTokenCount,
            outputTokenCount,
            reasoningTokenCount,
            modelDeploymentName,
            modelVersion,
            isSimulatorExecution,
            failureReasonCode,
            attemptIndex);

        return Task.CompletedTask;
    }
}
