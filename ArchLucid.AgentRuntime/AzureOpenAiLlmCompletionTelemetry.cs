using System.Diagnostics;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     GenAI span tags, latency metrics, and token-estimation diagnostics for Azure OpenAI completions.
/// </summary>
internal static class AzureOpenAiLlmCompletionTelemetry
{
    internal static string TruncateForSensitiveTelemetrySnapshot(string text)
    {
        if (string.IsNullOrEmpty(text))

            return string.Empty;

        if (text.Length <= ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars)

            return text;

        return text.Substring(0, ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars) + "…truncated";
    }

    internal static Activity? StartStreamActivity(string deploymentName) =>
        StartChatActivity("gen_ai.chat.completion.stream", deploymentName);

    internal static Activity? StartCompleteActivity(string deploymentName) =>
        StartChatActivity("gen_ai.chat.completion", deploymentName);

    internal static void TagPromptsIfEnabled(
        Activity? llmActivity,
        string systemPrompt,
        string userPrompt,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions)
    {
        if (llmTelemetryOptions?.CurrentValue.CapturePromptResponseOnSpans != true || llmActivity is null)
            return;

        llmActivity.SetTag("gen_ai.prompt.system", TruncateForSensitiveTelemetrySnapshot(systemPrompt));
        llmActivity.SetTag("gen_ai.prompt.user", TruncateForSensitiveTelemetrySnapshot(userPrompt));
    }

    internal static void TagCompletionResponse(
        Activity? llmActivity,
        string? modelId,
        string completionText,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions)
    {
        if (llmActivity is null)
            return;

        if (!string.IsNullOrWhiteSpace(modelId))
            llmActivity.SetTag("gen_ai.response.model", modelId.Trim());

        if (llmTelemetryOptions?.CurrentValue.CapturePromptResponseOnSpans == true)
            llmActivity.SetTag("gen_ai.completion", TruncateForSensitiveTelemetrySnapshot(completionText));
    }

    internal static void TagUsage(Activity? llmActivity, ChatTokenUsage usage)
    {
        if (llmActivity is null)
            return;

        llmActivity.SetTag("gen_ai.usage.input_tokens", usage.InputTokenCount);
        llmActivity.SetTag("gen_ai.usage.output_tokens", usage.OutputTokenCount);
        llmActivity.SetTag("gen_ai.usage.total_tokens", usage.TotalTokenCount);

        int reasoningTok = usage.OutputTokenDetails?.ReasoningTokenCount ?? 0;

        if (reasoningTok > 0)
            llmActivity.SetTag("gen_ai.usage.reasoning_tokens", reasoningTok);

        int cachedTok = AzureOpenAiChatTokenUsageReader.ReadCachedInputTokens(usage);

        if (cachedTok > 0)
            llmActivity.SetTag("gen_ai.usage.cached_input_tokens", cachedTok);
    }

    internal static void RecordStreamFinally(
        Activity? llmActivity,
        long latencyStartTicks,
        bool completionSucceeded)
    {
        if (!completionSucceeded)
            return;

        double latencyMs = Stopwatch.GetElapsedTime(latencyStartTicks).TotalMilliseconds;
        ApplyGenAiLatencyTag(llmActivity, latencyMs);

        ArchLucidInstrumentation.RecordLlmGenAiOperationDurationMilliseconds(
            "chat",
            latencyMs,
            completionSucceeded);
    }

    internal static void RecordCompleteFinally(
        Activity? llmActivity,
        long latencyStartTicks,
        bool completionSucceeded)
    {
        double latencyMs = Stopwatch.GetElapsedTime(latencyStartTicks).TotalMilliseconds;
        ApplyGenAiLatencyTag(llmActivity, latencyMs);

        ArchLucidInstrumentation.RecordLlmGenAiOperationDurationMilliseconds(
            "chat",
            latencyMs,
            completionSucceeded);
    }

    internal static void CheckTokenEstimationDiscrepancy(
        ILogger? logger,
        string systemPrompt,
        string userPrompt,
        int actualInputTokens)
    {
        if (logger == null || actualInputTokens <= 0)
            return;

        int estimatedInputTokens = ArchLucid.Retrieval.Chunking.TokenAwareContextBudget.EstimateTokenCount(
            systemPrompt + "\n" + userPrompt);

        if (estimatedInputTokens <= 0)
            return;

        double diffRatio = Math.Abs((double)actualInputTokens - estimatedInputTokens) / estimatedInputTokens;

        if (diffRatio <= 0.15)
            return;

        string? runId = null;
        string? agentType = null;
        Activity? current = Activity.Current;

        while (current != null)
        {
            runId ??= current.GetTagItem("archlucid.run_id") as string;
            agentType ??= current.GetTagItem("archlucid.agent.type_enum") as string;

            if (runId != null && agentType != null)
                break;

            current = current.Parent;
        }

        logger.LogWarning(
            "LLM token estimation discrepancy > 15%. Estimated: {Estimated}, Actual: {Actual}, RunId: {RunId}, AgentType: {AgentType}",
            estimatedInputTokens,
            actualInputTokens,
            runId ?? "unknown",
            agentType ?? "unknown");
    }

    private static Activity? StartChatActivity(string operationName, string deploymentName)
    {
        Activity? llmActivity = ArchLucidInstrumentation.AgentLlmCompletion.StartActivity(
            operationName,
            ActivityKind.Client);

        llmActivity?.SetTag("gen_ai.system", "azure_openai");
        llmActivity?.SetTag("gen_ai.operation.name", "chat");
        llmActivity?.SetTag("gen_ai.request.model", deploymentName);

        return llmActivity;
    }

    private static void ApplyGenAiLatencyTag(Activity? llmActivity, double latencyMilliseconds)
    {
        if (llmActivity is null)
            return;

        llmActivity.SetTag("gen_ai.completion.latency_ms", latencyMilliseconds);
    }
}
