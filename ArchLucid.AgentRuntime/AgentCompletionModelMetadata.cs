namespace ArchLucid.AgentRuntime;

/// <summary>
///     Reads model deployment / model id from the last successful
///     <see cref="AzureOpenAiCompletionClient.CompleteJsonAsync" /> on the async flow, if any.
/// </summary>
public static class AgentCompletionModelMetadata
{
    /// <summary>Prefix applied to <c>ModelDeploymentName</c> when the secondary fallback client was used.</summary>
    internal const string FallbackDeploymentPrefix = "fallback:";

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
            deploymentName = fallbackUsed ? FallbackDeploymentPrefix + d : d;
            modelVersion = v;

            return;
        }

        deploymentName = fallbackUsed ? FallbackDeploymentPrefix + "unknown" : null;
        modelVersion = null;
    }
}
