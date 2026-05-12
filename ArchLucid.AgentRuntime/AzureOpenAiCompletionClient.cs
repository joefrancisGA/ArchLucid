using System.ClientModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;
using System.Text;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Azure.AI.OpenAI;

using Microsoft.Extensions.Logging;

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
public sealed class AzureOpenAiCompletionClient : IAgentCompletionClient
{
    /// <summary>Used when <c>AzureOpenAI:MaxCompletionTokens</c> is omitted or zero.</summary>
    public const int DefaultMaxCompletionTokens = AzureOpenAiOptions.DefaultMaxCompletionTokens;

    private static readonly AsyncLocal<(int Prompt, int Completion, int Reasoning)?> LastCompletionTokenUsage = new();

    private static readonly AsyncLocal<(string DeploymentName, string? ModelId)?> LastModelMetadata = new();

    private readonly ChatClient _chatClient;
    private readonly string _deploymentName;
    private readonly int _maxOutputTokens;
    private readonly BinaryData? _structuredOutputAgentResultSchema;
    private readonly ILogger<AzureOpenAiCompletionClient>? _logger;

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
    public AzureOpenAiCompletionClient(
        string endpoint,
        string apiKey,
        string deploymentName,
        int maxCompletionTokens,
        BinaryData? structuredOutputAgentResultSchema = null,
        ILogger<AzureOpenAiCompletionClient>? logger = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentName);

        if (maxCompletionTokens < 1)
            throw new ArgumentOutOfRangeException(nameof(maxCompletionTokens), maxCompletionTokens,
                "Must be at least 1.");

        Uri endpointUri = new(endpoint);
        AzureOpenAIClient azureClient = new(
            endpointUri,
            new ApiKeyCredential(apiKey));

        _deploymentName = deploymentName.Trim();
        _chatClient = azureClient.GetChatClient(deploymentName);
        _maxOutputTokens = maxCompletionTokens;
        _structuredOutputAgentResultSchema = structuredOutputAgentResultSchema;
        _logger = logger;
        Descriptor = LlmProviderDescriptor.ForAzureOpenAi(endpointUri, deploymentName);
    }

    /// <inheritdoc />
    public LlmProviderDescriptor Descriptor
    {
        get;
    }

    /// <inheritdoc />
    /// <remarks>
    ///     Uses <c>Temperature = 0.1</c>, <c>MaxOutputTokenCount</c>, and either JSON schema structured output or
    ///     <c>ChatResponseFormat.CreateJsonObjectFormat()</c> when schema mode is off or after fallback.
    /// </remarks>
    public async Task<string> CompleteJsonAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(systemPrompt);
        ArgumentException.ThrowIfNullOrWhiteSpace(userPrompt);
        LastCompletionTokenUsage.Value = null;
        LastModelMetadata.Value = null;

        List<ChatMessage> messages =
        [
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        ];

        using Activity? llmActivity = ArchLucidInstrumentation.AgentLlmCompletion.StartActivity(
            "gen_ai.chat.completion",
            ActivityKind.Client);

        llmActivity?.SetTag("gen_ai.system", "azure_openai");

        ChatCompletion completion;

        try
        {
            completion = await CompleteChatCoreAsync(messages, cancellationToken).ConfigureAwait(false);
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

            if (inTok > 0 || outTok > 0 || reasoningTok > 0)

                LastCompletionTokenUsage.Value = (inTok, outTok, reasoningTok);

            if (llmActivity is not null)
            {
                llmActivity.SetTag("gen_ai.usage.input_tokens", usage.InputTokenCount);
                llmActivity.SetTag("gen_ai.usage.output_tokens", usage.OutputTokenCount);
                llmActivity.SetTag("gen_ai.usage.total_tokens", usage.TotalTokenCount);

                if (reasoningTok > 0)
                    llmActivity.SetTag("gen_ai.usage.reasoning_tokens", reasoningTok);
            }
        }

        IReadOnlyList<ChatMessageContentPart> parts = completion.Content;

        if (parts is null || parts.Count < 1)
            throw new InvalidOperationException("Azure OpenAI returned no message content.");

        string? text = parts[0].Text;

        if (string.IsNullOrEmpty(text))
            throw new InvalidOperationException("Azure OpenAI returned an empty assistant message.");

        string? modelId = completion.Model;
        LastModelMetadata.Value = (_deploymentName, string.IsNullOrWhiteSpace(modelId) ? null : modelId.Trim());

        ArchLucidInstrumentation.RecordLlmCompletionCallForCurrentRunBatch();

        string? reasoningSnippet = BuildReasoningTraceSnippet(completion);

        if (reasoningSnippet is not null)
            AgentHandlerLlmReasoningTrace.AppendCompletionSnippet(reasoningSnippet);

        return text;
    }

    private async Task<ChatCompletion> CompleteChatCoreAsync(
        List<ChatMessage> messages,
        CancellationToken cancellationToken)
    {
        ChatCompletionOptions jsonObjectOptions = CreateCompletionOptions(ChatResponseFormat.CreateJsonObjectFormat());

        if (_structuredOutputAgentResultSchema is null)
            return await CompleteChatOnceAsync(messages, jsonObjectOptions, cancellationToken).ConfigureAwait(false);

        ChatCompletionOptions schemaOptions = CreateCompletionOptions(
            ChatResponseFormat.CreateJsonSchemaFormat(
                "agent_result",
                _structuredOutputAgentResultSchema,
                "ArchLucid AgentResult wire JSON per schemas/agentresult.schema.json.",
                jsonSchemaIsStrict: true));

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

    private ChatCompletionOptions CreateCompletionOptions(ChatResponseFormat format)
    {
        return new ChatCompletionOptions
        {
            Temperature = 0.1f,
            MaxOutputTokenCount = _maxOutputTokens,
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
                TimeSpan wait = AzureOpenAiTooManyRequestsRetry.GetDelayBeforeRetry(
                    ex,
                    tooManyRequestsAttempt,
                    _logger,
                    out bool usedRetryAfterHeader);
                TagList rateTags = [];

                rateTags.Add("retry_after", usedRetryAfterHeader ? "header" : "fallback");

                ArchLucidInstrumentation.LlmRateLimitTotal.Add(1, rateTags);

                if (tooManyRequestsAttempt >= AzureOpenAiTooManyRequestsRetry.MaxConsecutiveTooManyRequestsAttempts - 1)
                    throw;

                await Task.Delay(wait, cancellationToken).ConfigureAwait(false);
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
    public static bool TryConsumeLastCompletionTokenUsage(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens)
    {
        (int Prompt, int Completion, int Reasoning)? raw = LastCompletionTokenUsage.Value;
        LastCompletionTokenUsage.Value = null;

        if (raw is { } v)
        {
            promptTokens = v.Prompt;
            completionTokens = v.Completion;
            reasoningTokens = v.Reasoning;

            return true;
        }

        promptTokens = 0;
        completionTokens = 0;
        reasoningTokens = 0;

        return false;
    }

    /// <summary>Peeks token usage from the last successful <see cref="CompleteJsonAsync" /> on this async flow without consuming it.</summary>
    public static bool TryPeekLastCompletionTokenUsage(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens)
    {
        (int Prompt, int Completion, int Reasoning)? raw = LastCompletionTokenUsage.Value;

        if (raw is { } v)
        {
            promptTokens = v.Prompt;
            completionTokens = v.Completion;
            reasoningTokens = v.Reasoning;

            return true;
        }

        promptTokens = 0;
        completionTokens = 0;
        reasoningTokens = 0;

        return false;
    }

    /// <summary>
    ///     Test hook: sets metadata read by <see cref="TryConsumeLastModelMetadata" /> (internals visible to
    ///     AgentRuntime.Tests).
    /// </summary>
    internal static void TestingSetLastModelMetadata(string deploymentName, string? modelId)
    {
        LastModelMetadata.Value = (deploymentName, modelId);
    }

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
}
