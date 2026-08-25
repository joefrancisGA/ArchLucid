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
public sealed partial class AzureOpenAiCompletionClient : IAgentStreamingCompletionClient, IDisposable
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
