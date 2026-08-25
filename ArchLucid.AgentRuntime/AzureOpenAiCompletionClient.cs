using System.ClientModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.CompilerServices;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Azure.AI.OpenAI;

using Azure.Identity;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using OpenAI.Chat;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Azure OpenAI chat client using JSON object response format and low temperature for deterministic structured
///     outputs. Optionally requests <c>json_schema</c> structured outputs for the <c>AgentResult</c> wire shape.
/// </summary>
/// <remarks>
///     When model output fails JSON deserialization or <see cref="ArchLucid.Contracts.Agents.AgentResult" /> validation, handlers use
///     <see cref="LlmAgentSchemaCompletion" /> to issue a follow-up completion with remediation instructions (bounded by
///     <c>AgentExecution:SchemaRemediation:MaxCompletionAttempts</c>) — this client stays a thin transport and does not parse
///     agent payloads.
/// </remarks>
[ExcludeFromCodeCoverage(Justification =
    "Thin wrapper around Azure OpenAI SDK; requires live Azure endpoint to exercise.")]
public sealed class AzureOpenAiCompletionClient : IAgentStreamingCompletionClient, IDisposable
{
    /// <summary>Used when <c>AzureOpenAI:MaxCompletionTokens</c> is omitted or zero.</summary>
    public const int DefaultMaxCompletionTokens = AzureOpenAiOptions.DefaultMaxCompletionTokens;

    private static readonly AsyncLocal<(string DeploymentName, string? ModelId)?> LastModelMetadata = new();

    /// <summary>
    ///     Test-only hook: seeds token counts read by <see cref="TryConsumeLastCompletionTokenUsage" /> on this async flow.
    ///     Used to unit-test <see cref="LlmCompletionAccountingClient" /> without a live Azure completion.
    /// </summary>
    internal static void SeedLastCompletionTokenUsageForTests(
        int promptTokens,
        int completionTokens,
        int reasoningTokens = 0,
        int cachedInputTokens = 0) =>
        LlmCompletionTokenUsageAmbient.TestingSeed(promptTokens, completionTokens, reasoningTokens, cachedInputTokens);

    private readonly AzureOpenAIClient _azureOpenAiClient;
    private readonly ChatClient _chatClient;
    private readonly string _deploymentName;
    private readonly int _maxOutputTokens;
    private readonly BinaryData? _structuredOutputAgentResultSchema;
    private readonly ILogger<AzureOpenAiCompletionClient>? _logger;

    /// <remarks>Observable per request for hot-reload toggle of sensitive span payloads.</remarks>
    private readonly IOptionsMonitor<LlmTelemetryOptions>? _llmTelemetryOptions;

    /// <summary>
    ///     Creates a client for the given deployment using Azure AD (managed identity / DefaultAzureCredential).
    /// </summary>
    public static AzureOpenAiCompletionClient CreateWithManagedIdentity(
        string endpoint,
        string deploymentName,
        int maxCompletionTokens,
        BinaryData? structuredOutputAgentResultSchema = null,
        ILogger<AzureOpenAiCompletionClient>? logger = null,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        if (maxCompletionTokens < 1)
            throw new ArgumentOutOfRangeException(nameof(maxCompletionTokens), maxCompletionTokens,
                "Must be at least 1.");

        Uri endpointUri = new(AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(endpoint));
        AzureOpenAIClient azureClient = new(endpointUri, new DefaultAzureCredential());

        AzureOpenAiCompletionClient client = new(
            azureClient,
            deploymentName.Trim(),
            maxCompletionTokens,
            structuredOutputAgentResultSchema,
            logger,
            llmTelemetryOptions,
            endpointUri);

        return client;
    }

    /// <summary>
    ///     Creates a client for the given deployment (model) on the Azure OpenAI resource.
    /// </summary>
    /// <param name="endpoint">Azure OpenAI endpoint URI.</param>
    /// <param name="apiKey">API key credential.</param>
    /// <param name="deploymentName">Chat deployment name.</param>
    /// <param name="maxCompletionTokens">Positive cap on completion tokens (output).</param>
    /// <param name="structuredOutputAgentResultSchema">
    ///     When non-null, completions use <see cref="ChatResponseFormat.CreateJsonSchemaFormat" /> (strict) for this
    ///     schema; HTTP 400 falls back to JSON object mode.
    /// </param>
    /// <param name="logger">Optional logger for structured-output fallback diagnostics.</param>
    /// <param name="llmTelemetryOptions">
    ///     When non-null and <see cref="LlmTelemetryOptions.CapturePromptResponseOnSpans" /> is true, attaches truncated
    ///     prompt/completion payloads to spans (default off — see telemetry docs).
    /// </param>
    public AzureOpenAiCompletionClient(
        string endpoint,
        string apiKey,
        string deploymentName,
        int maxCompletionTokens,
        BinaryData? structuredOutputAgentResultSchema = null,
        ILogger<AzureOpenAiCompletionClient>? logger = null,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        if (maxCompletionTokens < 1)
            throw new ArgumentOutOfRangeException(nameof(maxCompletionTokens), maxCompletionTokens,
                "Must be at least 1.");

        Uri endpointUri = new(AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(endpoint));
        AzureOpenAIClient azureClient = new(
            endpointUri,
            new ApiKeyCredential(apiKey));

        _azureOpenAiClient = azureClient;
        _deploymentName = deploymentName.Trim();
        _chatClient = azureClient.GetChatClient(_deploymentName);
        _maxOutputTokens = maxCompletionTokens;
        _structuredOutputAgentResultSchema = structuredOutputAgentResultSchema;
        _logger = logger;
        _llmTelemetryOptions = llmTelemetryOptions;
        Descriptor = LlmProviderDescriptor.ForAzureOpenAi(endpointUri, _deploymentName);
    }

    private AzureOpenAiCompletionClient(
        AzureOpenAIClient azureClient,
        string deploymentName,
        int maxCompletionTokens,
        BinaryData? structuredOutputAgentResultSchema,
        ILogger<AzureOpenAiCompletionClient>? logger,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions,
        Uri endpointUri)
    {
        _azureOpenAiClient = azureClient;
        _deploymentName = deploymentName;
        _chatClient = azureClient.GetChatClient(deploymentName);
        _maxOutputTokens = maxCompletionTokens;
        _structuredOutputAgentResultSchema = structuredOutputAgentResultSchema;
        _logger = logger;
        _llmTelemetryOptions = llmTelemetryOptions;
        Descriptor = LlmProviderDescriptor.ForAzureOpenAi(endpointUri, deploymentName);
    }

    /// <remarks>Truncates opt-in span payloads so exporters stay predictable.</remarks>
    internal static string TruncateForSensitiveTelemetrySnapshot(string text) =>
        AzureOpenAiLlmCompletionTelemetry.TruncateForSensitiveTelemetrySnapshot(text);

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor
    {
        get;
    }

    /// <inheritdoc />
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

    private async Task HandleTooManyRequestsAsync(
        ClientResultException ex,
        int tooManyRequestsAttempt,
        CancellationToken cancellationToken)
    {
        TimeSpan wait = AzureOpenAiTooManyRequestsRetry.GetDelayBeforeRetry(
            ex,
            tooManyRequestsAttempt,
            _logger,
            out bool usedRetryAfterHeader);
        TagList rateTags = [];

        rateTags.Add("retry_after", usedRetryAfterHeader ? "header" : "fallback");

        ArchLucidInstrumentation.LlmRateLimitTotal.Add(1, rateTags);

        if (tooManyRequestsAttempt >= AzureOpenAiTooManyRequestsRetry.MaxConsecutiveTooManyRequestsAttempts - 1)
            throw ex;

        await Task.Delay(wait, cancellationToken).ConfigureAwait(false);
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
    public static bool TryConsumeLastCompletionTokenUsage(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens) =>
        LlmCompletionTokenUsageAmbient.TryConsumeRaw(out promptTokens, out completionTokens, out reasoningTokens);

    /// <summary>Peeks token usage from the last successful <see cref="CompleteJsonAsync" /> on this async flow without consuming it.</summary>
    public static bool TryPeekLastCompletionTokenUsage(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens) =>
        LlmCompletionTokenUsageAmbient.TryPeekRaw(out promptTokens, out completionTokens, out reasoningTokens, out _);

    /// <summary>Peeks token usage including cached prompt tokens without consuming ambient state.</summary>
    public static bool TryPeekLastCompletionTokenUsage(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens,
        out int cachedInputTokens) =>
        LlmCompletionTokenUsageAmbient.TryPeekRaw(out promptTokens, out completionTokens, out reasoningTokens, out cachedInputTokens);

    /// <summary>
    ///     Test hook: sets metadata read by <see cref="TryConsumeLastModelMetadata" /> (internals visible to
    ///     AgentRuntime.Tests).
    /// </summary>
    internal static void TestingSetLastModelMetadata(string deploymentName, string? modelId)
    {
        LastModelMetadata.Value = (deploymentName, modelId);
    }

    /// <summary>Test hook: seeds token usage read by <see cref="TryPeekLastCompletionTokenUsage" />.</summary>
    internal static void TestingSetLastCompletionTokenUsage(int promptTokens, int completionTokens, int reasoningTokens = 0) =>
        LlmCompletionTokenUsageAmbient.TestingSeed(promptTokens, completionTokens, reasoningTokens);

    /// <summary>
    ///     Consumes deployment name and provider-reported model id from the last successful
    ///     <see cref="CompleteJsonAsync" /> on this async flow, if any.
    /// </summary>
    public static bool TryConsumeLastModelMetadata(out string deploymentName, out string? modelVersion)
    {
        (string DeploymentName, string? ModelId)? raw = LastModelMetadata.Value;
        LastModelMetadata.Value = null;

        if (raw is { } v)
        {
            deploymentName = v.DeploymentName;
            modelVersion = v.ModelId;

            return true;
        }

        deploymentName = string.Empty;
        modelVersion = null;

        return false;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (_azureOpenAiClient is IAsyncDisposable asyncAzureClient)
        {
            asyncAzureClient.DisposeAsync().AsTask().GetAwaiter().GetResult();

            return;
        }

        if (_azureOpenAiClient is IDisposable disposableAzureClient)

            disposableAzureClient.Dispose();
    }
}
