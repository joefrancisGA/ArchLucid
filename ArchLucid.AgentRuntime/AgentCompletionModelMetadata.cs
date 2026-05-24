using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Reads model deployment / model id from the last successful
///     <see cref="AzureOpenAiCompletionClient.CompleteJsonAsync" /> on the async flow, if any.
/// </summary>
public static class AgentCompletionModelMetadata
{
    /// <summary>
    ///     Sets <paramref name="deploymentName" /> and <paramref name="modelVersion" /> from the last LLM call on this
    ///     async flow. When the <see cref="FallbackAgentCompletionClient" /> used its secondary for that call, the
    ///     deployment name is prefixed with <c>"fallback:"</c> so persisted traces are distinguishable from clean
    ///     primary-path runs.
    /// </summary>
    public static void TryConsume(out string? deploymentName, out string? modelVersion)
    {
        bool fallbackUsed = FallbackAgentCompletionClient.TryConsumeLastFallbackUsed();

        if (AzureOpenAiCompletionClient.TryConsumeLastModelMetadata(out string d, out string? v)
            && !string.IsNullOrWhiteSpace(d))
        {
            deploymentName = fallbackUsed
                ? AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + d
                : d;
            modelVersion = v;

            return;
        }

        deploymentName = fallbackUsed
            ? AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "unknown"
            : null;
        modelVersion = null;
    }
}
