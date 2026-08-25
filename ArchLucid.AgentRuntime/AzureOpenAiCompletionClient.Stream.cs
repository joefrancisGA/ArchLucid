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
    public async IAsyncEnumerable<string> StreamJsonAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens = null,
        float? temperature = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        await foreach (string chunk in StreamJsonWithTelemetryAsync(
                           systemPrompt,
                           userPrompt,
                           maxTokens,
                           temperature,
                           cancellationToken).ConfigureAwait(false))
        {
            yield return chunk;
        }
    }
    private async IAsyncEnumerable<string> StreamJsonWithTelemetryAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens,
        float? temperature,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentException.ThrowIfNullOrWhiteSpace(userPrompt);
        LlmCompletionTokenUsageAmbient.Clear();
        LlmCompletionRequestParamsAmbient.Clear();
        LastModelMetadata.Value = null;

        bool completionSucceededForTelemetry = false;
        long latencyStartTicks = Stopwatch.GetTimestamp();

        using Activity? llmActivity = AzureOpenAiLlmCompletionTelemetry.StartStreamActivity(_deploymentName);

        try
        {
            await foreach (string chunk in StreamJsonTokensAsync(
                               systemPrompt,
                               userPrompt,
                               maxTokens,
                               temperature,
                               cancellationToken).ConfigureAwait(false))
            {
                yield return chunk;
            }

            ArchLucidInstrumentation.RecordLlmCompletionCallForCurrentRunBatch();
            llmActivity?.SetStatus(ActivityStatusCode.Ok);
            completionSucceededForTelemetry = true;
        }
        finally
        {
            if (!completionSucceededForTelemetry)
                LastModelMetadata.Value = null;

            AzureOpenAiLlmCompletionTelemetry.RecordStreamFinally(
                llmActivity,
                latencyStartTicks,
                completionSucceededForTelemetry);
        }
    }
    private async IAsyncEnumerable<string> StreamJsonTokensAsync(
        string systemPrompt,
        string userPrompt,
        int? maxTokens,
        float? temperature,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        List<ChatMessage> messages =
        [
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        ];

        ChatCompletionOptions options = CreateCompletionOptions(
            ChatResponseFormat.CreateJsonObjectFormat(),
            maxTokens,
            temperature);

        StringBuilder fullText = new();

        await foreach (StreamingChatCompletionUpdate update in StreamChatCoreAsync(
                           messages,
                           options,
                           cancellationToken).ConfigureAwait(false))
        {
            IReadOnlyList<ChatMessageContentPart> parts = update.ContentUpdate;

            if (parts is null || parts.Count < 1)
                continue;

            foreach (ChatMessageContentPart part in parts)
            {
                if (part.Kind != ChatMessageContentPartKind.Text || string.IsNullOrEmpty(part.Text))
                    continue;

                fullText.Append(part.Text);
                yield return part.Text;
            }

            if (update.Usage is { } usage)
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
            }

            if (!string.IsNullOrWhiteSpace(update.Model))
                LastModelMetadata.Value = (_deploymentName, update.Model.Trim());
        }

        if (fullText.Length < 1)

            throw new InvalidOperationException("Azure OpenAI streaming returned no message content.");
    }

    /// <inheritdoc />
    /// <remarks>
    ///     Uses <c>Temperature = 0.1</c>, <c>MaxOutputTokenCount</c>, and either JSON schema structured output or
    ///     <c>ChatResponseFormat.CreateJsonObjectFormat()</c> when schema mode is off or after fallback.
    /// </remarks>
    private async IAsyncEnumerable<StreamingChatCompletionUpdate> StreamChatCoreAsync(
        List<ChatMessage> messages,
        ChatCompletionOptions options,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        for (int tooManyRequestsAttempt = 0; ; tooManyRequestsAttempt++)
        {
            IAsyncEnumerable<StreamingChatCompletionUpdate> stream;

            try
            {
                stream = _chatClient.CompleteChatStreamingAsync(messages, options, cancellationToken);
            }
            catch (ClientResultException ex) when (ex.Status == 429)
            {
                await HandleTooManyRequestsAsync(ex, tooManyRequestsAttempt, cancellationToken).ConfigureAwait(false);
                continue;
            }

            await foreach (StreamingChatCompletionUpdate update in stream.ConfigureAwait(false))
                yield return update;

            yield break;
        }
    }
}
