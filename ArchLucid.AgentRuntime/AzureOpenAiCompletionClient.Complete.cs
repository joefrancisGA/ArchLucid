using System.ClientModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Azure.AI.OpenAI;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

public sealed partial class AzureOpenAiCompletionClient
{
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentException.ThrowIfNullOrWhiteSpace(userPrompt);
        LlmCompletionTokenUsageAmbient.Clear();
        LlmCompletionRequestParamsAmbient.Clear();
        LastModelMetadata.Value = null;

        bool completionSucceededForTelemetry = false;

        List<ChatMessage> messages =
        [
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        ];

        using Activity? llmActivity = AzureOpenAiLlmCompletionTelemetry.StartCompleteActivity(_deploymentName);

        long latencyStartTicks = Stopwatch.GetTimestamp();

        AzureOpenAiLlmCompletionTelemetry.TagPromptsIfEnabled(
            llmActivity,
            systemPrompt,
            userPrompt,
            _llmTelemetryOptions);

        ChatCompletion completion;

        try
        {

            try
            {
                completion = await CompleteChatCoreAsync(messages, maxTokens, temperature, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                LastModelMetadata.Value = null;
                llmActivity?.SetStatus(ActivityStatusCode.Error, ex.Message);
                llmActivity?.AddException(ex);

                throw;
            }

            if (completion.Usage is { } usage)
            {
                int inTok = usage.InputTokenCount is var ip ? ip : 0;
                int outTok = usage.OutputTokenCount is var op ? op : 0;
                int reasoningTok = usage.OutputTokenDetails?.ReasoningTokenCount ?? 0;
                int cachedTok = AzureOpenAiChatTokenUsageReader.ReadCachedInputTokens(usage);

                if (inTok > 0 || outTok > 0 || reasoningTok > 0 || cachedTok > 0)
                {
                    LlmCompletionTokenUsageAmbient.Record(inTok, outTok, reasoningTok, cachedTok);
                    AzureOpenAiLlmCompletionTelemetry.CheckTokenEstimationDiscrepancy(
                        _logger,
                        systemPrompt,
                        userPrompt,
                        inTok);
                }

                AzureOpenAiLlmCompletionTelemetry.TagUsage(llmActivity, usage);
            }

            IReadOnlyList<ChatMessageContentPart> parts = completion.Content;

            if (parts is null || parts.Count < 1)

                throw new InvalidOperationException("Azure OpenAI returned no message content.");

            string? text = parts[0].Text;

            if (string.IsNullOrEmpty(text))

                throw new InvalidOperationException("Azure OpenAI returned an empty assistant message.");

            string? modelId = completion.Model;
            LastModelMetadata.Value = (_deploymentName, string.IsNullOrWhiteSpace(modelId) ? null : modelId.Trim());

            AzureOpenAiLlmCompletionTelemetry.TagCompletionResponse(
                llmActivity,
                modelId,
                text,
                _llmTelemetryOptions);

            ArchLucidInstrumentation.RecordLlmCompletionCallForCurrentRunBatch();

            string? reasoningSnippet = BuildReasoningTraceSnippet(completion);

            if (reasoningSnippet is not null)
                AgentHandlerLlmReasoningTrace.AppendCompletionSnippet(reasoningSnippet);

            llmActivity?.SetStatus(ActivityStatusCode.Ok);

            completionSucceededForTelemetry = true;

            return text;
        }
        finally
        {
            AzureOpenAiLlmCompletionTelemetry.RecordCompleteFinally(
                llmActivity,
                latencyStartTicks,
                completionSucceededForTelemetry);
        }

    }
    private async Task<ChatCompletion> CompleteChatCoreAsync(
        List<ChatMessage> messages,
        int? maxTokens,
        float? temperature,
        CancellationToken cancellationToken)
    {
        ChatCompletionOptions jsonObjectOptions = CreateCompletionOptions(
            ChatResponseFormat.CreateJsonObjectFormat(),
            maxTokens,
            temperature);

        if (_structuredOutputAgentResultSchema is null)
            return await CompleteChatOnceAsync(messages, jsonObjectOptions, cancellationToken).ConfigureAwait(false);

        ChatCompletionOptions schemaOptions = CreateCompletionOptions(
            ChatResponseFormat.CreateJsonSchemaFormat(
                "agent_result",
                _structuredOutputAgentResultSchema,
                "ArchLucid AgentResult wire JSON per schemas/agentresult.schema.json.",
                jsonSchemaIsStrict: true),
            maxTokens,
            temperature);

        try
        {
            return await CompleteChatOnceAsync(messages, schemaOptions, cancellationToken).ConfigureAwait(false);
        }
        catch (ClientResultException ex) when (ex.Status == 400)
        {
            ILogger<AzureOpenAiCompletionClient>? log = _logger;

            if (log is not null && log.IsEnabled(LogLevel.Warning))
                log.LogWarning(
                    ex,
                    "Azure OpenAI returned HTTP 400 for json_schema structured output; falling back to json_object response format.");

            return await CompleteChatOnceAsync(messages, jsonObjectOptions, cancellationToken).ConfigureAwait(false);
        }
    }
    private ChatCompletionOptions CreateCompletionOptions(ChatResponseFormat format, int? maxTokens, float? temperature)
    {
        float resolvedTemperature = temperature ?? 0.1f;
        int resolvedMaxOutputTokens = maxTokens ?? _maxOutputTokens;

        LlmCompletionRequestParamsAmbient.Record(resolvedTemperature, resolvedMaxOutputTokens);

        return new ChatCompletionOptions
        {
            Temperature = resolvedTemperature,
            MaxOutputTokenCount = resolvedMaxOutputTokens,
            ResponseFormat = format
        };
    }
    private async Task<ChatCompletion> CompleteChatOnceAsync(
        List<ChatMessage> messages,
        ChatCompletionOptions options,
        CancellationToken cancellationToken)
    {
        for (int tooManyRequestsAttempt = 0; ; tooManyRequestsAttempt++)
        {
            try
            {
                ClientResult<ChatCompletion> response = await _chatClient.CompleteChatAsync(
                    messages,
                    options,
                    cancellationToken).ConfigureAwait(false);

                return response.Value;
            }
            catch (ClientResultException ex) when (ex.Status == 429)
            {
                await HandleTooManyRequestsAsync(ex, tooManyRequestsAttempt, cancellationToken).ConfigureAwait(false);
            }
        }
    }
    private static string? BuildReasoningTraceSnippet(ChatCompletion completion)
    {
        StringBuilder chunks = new();

        IReadOnlyList<ChatMessageContentPart> parts = completion.Content;

        if (parts is not null && parts.Count > 1)
        {
            for (int i = 1; i < parts.Count; i++)
            {
                ChatMessageContentPart p = parts[i];

                if (p.Kind != ChatMessageContentPartKind.Text || string.IsNullOrWhiteSpace(p.Text))
                    continue;
                if (chunks.Length > 0)
                    chunks.Append("\n\n---\n\n");

                chunks.Append(p.Text.Trim());
            }
        }

        ChatTokenUsage? usage = completion.Usage;

        if (usage?.OutputTokenDetails?.ReasoningTokenCount is not ({ } rc and > 0))
            return chunks.Length == 0 ? null : chunks.ToString();

        if (chunks.Length > 0)
            chunks.Append("\n\n---\n\n");

        chunks.Append("Provider reasoning tokens: ");
        chunks.Append(rc);

        return chunks.Length == 0 ? null : chunks.ToString();
    }

    /// <summary>Consumes token usage from the last successful <see cref="CompleteJsonAsync" /> on this async flow, if any.</summary>
}
