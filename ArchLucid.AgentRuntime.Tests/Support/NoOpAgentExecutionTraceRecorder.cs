using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>No-op trace recorder for unit tests that do not assert on LLM trace persistence.</summary>
public sealed class NoOpAgentExecutionTraceRecorder : IAgentExecutionTraceRecorder
{
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
        return Task.CompletedTask;
    }
}
