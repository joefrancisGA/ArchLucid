using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>Captures every <see cref="IAgentExecutionTraceRecorder.RecordAsync" /> invocation in order.</summary>
public sealed class ListCapturingAgentExecutionTraceRecorder : IAgentExecutionTraceRecorder
{
    public List<CapturingAgentExecutionTraceRecorder.CapturedTraceCall> Calls { get; } = [];

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
        Calls.Add(new CapturingAgentExecutionTraceRecorder.CapturedTraceCall(
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
            attemptIndex));

        return Task.CompletedTask;
    }
}
