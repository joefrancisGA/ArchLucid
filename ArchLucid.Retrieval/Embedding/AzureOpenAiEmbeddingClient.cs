using System.ClientModel;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;

using Azure.AI.OpenAI;
using Azure.Identity;

using Microsoft.Extensions.Options;

using OpenAI.Embeddings;

namespace ArchLucid.Retrieval.Embedding;

/// <summary>
///     Azure OpenAI text embeddings for a named embedding deployment on the resource.
/// </summary>
/// <remarks>Emits spans on <see cref="ArchLucidInstrumentation.AgentLlmEmbedding" /> for OTLP/App Insights exporters.</remarks>
[ExcludeFromCodeCoverage(Justification =
    "Thin wrapper around Azure OpenAI SDK; requires live Azure endpoint to exercise.")]
public sealed class AzureOpenAiEmbeddingClient : IOpenAiEmbeddingClient
{
    /// <summary>
    ///     Default per-operation network timeout when callers omit an explicit budget
    ///     (under the UI proxy 60s abort and typical <see cref="RetrievalQueryBudgetOptions"/> overall budget).
    /// </summary>
    public static readonly TimeSpan DefaultNetworkTimeout = TimeSpan.FromSeconds(15);

    private readonly EmbeddingClient _embeddingClient;

    private readonly string _embeddingDeploymentName;

    private readonly IOptionsMonitor<LlmTelemetryOptions>? _llmTelemetryOptions;

    /// <param name="embeddingDeploymentName">Embeddings deployment name (not the chat deployment).</param>
    /// <param name="llmTelemetryOptions">Optional telemetry toggles (<see cref="LlmTelemetryOptions.CapturePromptResponseOnSpans"/>).</param>
    /// <param name="networkTimeout">Optional per-call network timeout; defaults to <see cref="DefaultNetworkTimeout"/>.</param>
    public AzureOpenAiEmbeddingClient(
        string endpoint,
        string apiKey,
        string embeddingDeploymentName,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions = null,
        TimeSpan? networkTimeout = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(embeddingDeploymentName);

        Uri endpointUri = new(endpoint.Trim());
        AzureOpenAIClientOptions clientOptions = CreateClientOptions(networkTimeout);
        AzureOpenAIClient azureClient = new(endpointUri, new ApiKeyCredential(apiKey.Trim()), clientOptions);
        string deployment = embeddingDeploymentName.Trim();
        _embeddingDeploymentName = deployment;
        _embeddingClient = azureClient.GetEmbeddingClient(deployment);
        _llmTelemetryOptions = llmTelemetryOptions;
    }

    /// <summary>
    ///     Creates an embedding client using Azure AD (<see cref="DefaultAzureCredential" />) (TB-080).
    /// </summary>
    public static AzureOpenAiEmbeddingClient CreateWithManagedIdentity(
        string endpoint,
        string embeddingDeploymentName,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions = null,
        TimeSpan? networkTimeout = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(embeddingDeploymentName);

        Uri endpointUri = new(endpoint.Trim());
        AzureOpenAIClientOptions clientOptions = CreateClientOptions(networkTimeout);
        AzureOpenAIClient azureClient = new(endpointUri, new DefaultAzureCredential(), clientOptions);
        string deployment = embeddingDeploymentName.Trim();

        AzureOpenAiEmbeddingClient client = new(azureClient, deployment, llmTelemetryOptions);

        return client;
    }

    private AzureOpenAiEmbeddingClient(
        AzureOpenAIClient azureClient,
        string embeddingDeploymentName,
        IOptionsMonitor<LlmTelemetryOptions>? llmTelemetryOptions)
    {
        ArgumentNullException.ThrowIfNull(azureClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(embeddingDeploymentName);

        string deployment = embeddingDeploymentName.Trim();
        _embeddingDeploymentName = deployment;
        _embeddingClient = azureClient.GetEmbeddingClient(deployment);
        _llmTelemetryOptions = llmTelemetryOptions;
    }

    /// <inheritdoc />
    public async Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(text);

        IReadOnlyList<float[]> batch = await EmbedManyCoreAsync(
            [
                text.Trim(),
            ],
            ct).ConfigureAwait(false);

        if (batch.Count < 1)
            throw new InvalidOperationException("Embedding provider returned no vectors.");

        return batch[0];
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<float[]>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(texts);

        if (texts.Count == 0)
            return Task.FromResult<IReadOnlyList<float[]>>([]);

        List<string> normalized = texts.Where(t => !string.IsNullOrWhiteSpace(t)).Select(static t => t.Trim()).ToList();

        if (normalized.Count == 0)
            throw new ArgumentException("All embedding inputs were null or whitespace.", nameof(texts));

        return EmbedManyCoreAsync(normalized, ct);
    }

    /// <remarks>Shared batch path (<see cref="EmbedAsync"/> is a cardinality-one delegation).</remarks>
    private async Task<IReadOnlyList<float[]>> EmbedManyCoreAsync(List<string> texts, CancellationToken ct)
    {
        long latencyTicks = Stopwatch.GetTimestamp();

        bool operationSucceededForTelemetry = false;

        using Activity? activity =
            ArchLucidInstrumentation.AgentLlmEmbedding.StartActivity("gen_ai.embeddings", ActivityKind.Client);

        activity?.SetTag("gen_ai.system", "azure_openai");
        activity?.SetTag("gen_ai.operation.name", "embeddings");
        activity?.SetTag("gen_ai.request.model", _embeddingDeploymentName);
        activity?.SetTag("gen_ai.embedding.inputs", texts.Count);

        try
        {
            if (_llmTelemetryOptions?.CurrentValue.CapturePromptResponseOnSpans == true && activity is not null)
                activity.SetTag("gen_ai.embedding.prompt", BuildEmbeddingPromptSnapshot(texts));

            // Async path yields the thread pool while waiting on AOAI — sync GenerateEmbeddings blocked a worker
            // for the full network wait and could outlive the UI proxy abort (CI #2268 class hang).
            ClientResult<OpenAIEmbeddingCollection> response =
                await _embeddingClient.GenerateEmbeddingsAsync(texts, cancellationToken: ct).ConfigureAwait(false);

            OpenAIEmbeddingCollection collection = response.Value;

            EmbeddingTokenUsage? embeddingUsage = collection.Usage;

            if (embeddingUsage is not null && activity is not null)
            {
                activity.SetTag("gen_ai.usage.input_tokens", embeddingUsage.InputTokenCount);
                activity.SetTag("gen_ai.usage.total_tokens", embeddingUsage.TotalTokenCount);
            }

            if (embeddingUsage?.InputTokenCount is { } inTok && inTok > 0)
                ArchLucidInstrumentation.RecordLlmEmbeddingInputTokens(inTok, _embeddingDeploymentName);

            List<float[]> vectors = collection.Select(static e => e.ToFloats().ToArray()).ToList();

            activity?.SetStatus(ActivityStatusCode.Ok);

            operationSucceededForTelemetry = true;

            return vectors;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.AddException(ex);

            throw;
        }
        finally
        {
            double latencyMs = Stopwatch.GetElapsedTime(latencyTicks).TotalMilliseconds;

            if (activity is not null)
                activity.SetTag("gen_ai.completion.latency_ms", latencyMs);

            ArchLucidInstrumentation.RecordLlmGenAiOperationDurationMilliseconds(
                "embeddings",
                latencyMs,
                operationSucceededForTelemetry);
        }
    }

    private static AzureOpenAIClientOptions CreateClientOptions(TimeSpan? networkTimeout)
    {
        return new AzureOpenAIClientOptions
        {
            NetworkTimeout = networkTimeout ?? DefaultNetworkTimeout,
        };
    }

    /// <remarks>Never tags every embedding string separately—joins summaries to keep cardinality bounded.</remarks>
    private static string BuildEmbeddingPromptSnapshot(IReadOnlyList<string> texts)
    {
        if (texts.Count == 0)
            return string.Empty;

        if (texts.Count == 1)
            return Truncate(texts[0]);

        return $"{Truncate(texts[0])}\n---\n{Truncate(texts[1])}\n(+{texts.Count - 2} more)";
    }

    private static string Truncate(string text)
    {
        if (text.Length <= ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars)
            return text;

        return text.Substring(0, ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars) + "…truncated";
    }
}
