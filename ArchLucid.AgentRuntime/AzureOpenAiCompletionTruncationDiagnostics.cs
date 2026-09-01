using Microsoft.Extensions.Logging;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

/// <summary>Detects Azure OpenAI output truncation and records non-fatal operator warnings.</summary>
internal static class AzureOpenAiCompletionTruncationDiagnostics
{
    internal static bool IsOutputTruncated(ChatFinishReason finishReason) =>
        finishReason == ChatFinishReason.Length;

    internal static void ReportIfOutputTruncated(
        ChatCompletion completion,
        int maxOutputTokens,
        string deploymentName,
        ILogger? logger,
        ILlmCompletionOutputTruncationReporter? reporter)
    {
        ArgumentNullException.ThrowIfNull(completion);

        if (!IsOutputTruncated(completion.FinishReason))
            return;

        ReportTruncation(
            deploymentName,
            maxOutputTokens,
            completion.Usage?.OutputTokenCount ?? 0,
            completion.Usage?.OutputTokenDetails?.ReasoningTokenCount ?? 0,
            logger,
            reporter);
    }

    internal static void ReportIfOutputTruncated(
        ChatFinishReason? finishReason,
        int maxOutputTokens,
        string deploymentName,
        int outputTokenCount,
        int reasoningTokenCount,
        ILogger? logger,
        ILlmCompletionOutputTruncationReporter? reporter)
    {
        if (finishReason is not ChatFinishReason.Length)
            return;

        ReportTruncation(
            deploymentName,
            maxOutputTokens,
            outputTokenCount,
            reasoningTokenCount,
            logger,
            reporter);
    }

    private static void ReportTruncation(
        string deploymentName,
        int maxOutputTokens,
        int outputTokenCount,
        int reasoningTokenCount,
        ILogger? logger,
        ILlmCompletionOutputTruncationReporter? reporter)
    {
        LlmCompletionOutputTruncationEvent detail = new(
            deploymentName,
            maxOutputTokens,
            outputTokenCount,
            reasoningTokenCount);

        if (reporter is not null)
        {
            reporter.Report(detail);

            return;
        }

        if (logger is not null && logger.IsEnabled(LogLevel.Warning))
        {
            logger.LogWarning(
                "Azure OpenAI completion output was truncated (finish_reason=length). Deployment={DeploymentName}, "
                + "MaxOutputTokens={MaxOutputTokens}, OutputTokenCount={OutputTokenCount}, ReasoningTokenCount={ReasoningTokenCount}. "
                + "Structured JSON may be incomplete; consider raising AzureOpenAI:MaxCompletionTokens.",
                deploymentName,
                maxOutputTokens,
                outputTokenCount,
                reasoningTokenCount);
        }
    }
}
